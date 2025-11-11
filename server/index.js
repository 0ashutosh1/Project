const dotenv = require('dotenv');
dotenv.config(); // Must be at the very top

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const csrf = require('csurf');
const axios = require('axios'); // <-- Our new http client
const { protect, admin } = require('./middleware/authMiddleware');
const User = require('./models/User');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const tokenBlacklist = require('./utils/tokenBlacklist');
const auditLogger = require('./utils/auditLogger');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middlewares ---
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true 
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
// --- Removed passport.initialize() ---

// General rate limiter for most routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Stricter rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 10, // Limit each IP to 10 auth-related requests per window
  message: 'Too many authentication attempts, please try again after 30 minutes',
});

// Apply the general limiter to all routes starting with /api
app.use('/api', apiLimiter);

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Successfully connected to MongoDB!"))
  .catch((error) => console.error("❌ Error connecting to MongoDB:", error.message));

// --- Basic Test Route ---
app.get('/api', (req, res) => {
  res.json({ message: "Hello from the Nimbus server!" });
});


// ===================================
// ===     MANUAL PKCE AUTH        ===
// ===================================
const googleAuthValidation = [
  authLimiter,
  body('code').notEmpty().isString().withMessage('Authorization code must be a non-empty string'),
  body('verifier').notEmpty().isString().withMessage('PKCE verifier must be a non-empty string'),
  body('nonce').notEmpty().isString().withMessage('Nonce must be a non-empty string') // <-- ADD THIS
];

// --- ADD THIS NEW VALIDATION ARRAY ---
const githubAuthValidation = [
  authLimiter, // Use the same rate limiter
  body('code').notEmpty().isString().withMessage('Authorization code must be a non-empty string')
];

app.post('/auth/google', googleAuthValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { code, verifier, nonce } = req.body;

  if (!code || !verifier || !nonce) { // <-- 2. Update check
    return res.status(400).json({ message: 'Code, verifier, and nonce are required.' });
  }

  const correlationId = auditLogger.logAuth({
    type: 'login_attempt',
    provider: 'google',
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    success: false
  });

  try {
    // --- 1. Exchange the code for tokens (Same as before) ---
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        code_verifier: verifier,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:3000/auth/callback',
      },
    });

    const { id_token } = tokenResponse.data;

    // --- 2. Get user profile (Same as before) ---
    const profile = jwt.decode(id_token);
    if (!profile) {
      auditLogger.logAuth({
        correlationId,
        type: 'login',
        provider: 'google',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        success: false,
        errorMessage: 'Invalid ID token'
      });
      return res.status(400).json({ message: 'Invalid ID token' });
    }

    // --- 3. VALIDATE NONCE (CRITICAL!) ---
    if (profile.nonce !== nonce) {
      auditLogger.logSecurity({
        correlationId,
        type: 'replay_attack',
        severity: 'high',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'Nonce mismatch detected'
      });
      return res.status(401).json({ message: 'Invalid nonce. Replay attack suspected.' });
    }

    // --- 4. Find or Create User (Same as before) ---
    let user = await User.findOne({ 'providers.googleId': profile.sub });
    if (!user) {
      user = new User({
        email: profile.email,
        name: profile.name,
        avatar: profile.picture || null,
        providers: { googleId: profile.sub },
        lastLogin: new Date()
      });
      await user.save();
      
      auditLogger.logAuth({
        correlationId,
        type: 'register',
        provider: 'google',
        userId: user.id,
        email: user.email,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        success: true
      });
    } else {
      // Update avatar and last login on returning user
      user.avatar = profile.picture || user.avatar;
      user.name = profile.name || user.name;
      user.lastLogin = new Date();
      await user.save();
    }

    // --- 5. CREATE *TWO* JWTs (This is the new part) ---
    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    // Create the Access Token (15 minutes)
    const accessToken = jwt.sign(
      userPayload, 
      process.env.JWT_ACCESS_SECRET, 
      { expiresIn: process.env.JWT_ACCESS_EXPIRATION }
    );

    // Create the Refresh Token (7 days)
    const refreshToken = jwt.sign(
      userPayload, // You can have a simpler payload for the refresh token
      process.env.JWT_REFRESH_SECRET, 
      { expiresIn: process.env.JWT_REFRESH_EXPIRATION }
    );

    // --- 6. Set the REFRESH token as an httpOnly cookie ---
    // We rename the cookie to 'refreshToken'
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // Set to true if on HTTPS
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days (must match token expiry)
    });

    auditLogger.logAuth({
      correlationId,
      type: 'login',
      provider: 'google',
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    // --- 7. Send the ACCESS token in the JSON response ---
    res.status(200).json({ 
      message: 'Login successful',
      accessToken: accessToken // Send the access token to the client
    });

  } catch (err) {
    console.error('Error during Google auth:', err.response ? err.response.data : err.message);
    auditLogger.logAuth({
      correlationId,
      type: 'login',
      provider: 'google',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: false,
      errorMessage: err.message
    });
    res.status(500).json({ message: 'Authentication failed.' });
  }
});

// ===================================
// ===      FACEBOOK AUTH          ===
// ===================================
const facebookAuthValidation = [
  authLimiter,
  body('code').notEmpty().isString().withMessage('Authorization code must be a non-empty string')
];

app.post('/auth/facebook', facebookAuthValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { code } = req.body;

  try {
    // --- 1. Exchange the code for an access token ---
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        code: code,
        redirect_uri: 'http://localhost:3000/auth/callback',
      }
    });

    const { access_token } = tokenResponse.data;
    if (!access_token) {
      return res.status(500).json({ message: 'Facebook auth failed: No token received.' });
    }

    // --- 2. Get the user's profile from Facebook ---
    const userResponse = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,email,picture',
        access_token: access_token
      }
    });

    const profile = userResponse.data;

    // --- 3. Check if email exists ---
    if (!profile.email) {
      return res.status(400).json({ 
        message: 'Facebook login failed: Email permission not granted. Please allow email access.' 
      });
    }

    // --- 4. Find or Create User ---
    let user = await User.findOne({ 'providers.facebookId': profile.id });

    if (!user) {
      user = await User.findOne({ email: profile.email });

      if (user) {
        // Link Facebook to existing account
        user.providers.facebookId = profile.id;
        await user.save();
      } else {
        // Create new user
        user = new User({
          email: profile.email,
          name: profile.name,
          providers: {
            facebookId: profile.id
          }
        });
        await user.save();
      }
    }

    // --- 5. Create JWTs ---
    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    const accessToken = jwt.sign(
      userPayload, 
      process.env.JWT_ACCESS_SECRET, 
      { expiresIn: process.env.JWT_ACCESS_EXPIRATION }
    );

    const refreshToken = jwt.sign(
      userPayload,
      process.env.JWT_REFRESH_SECRET, 
      { expiresIn: process.env.JWT_REFRESH_EXPIRATION }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ 
      message: 'Login successful',
      accessToken: accessToken
    });

  } catch (err) {
    console.error('Error during Facebook auth:', err.response ? err.response.data : err.message);
    res.status(500).json({ message: 'Authentication failed.' });
  }
});

// ===================================
// ===       GITHUB AUTH           ===
// ===================================
app.post('/auth/github', githubAuthValidation, async (req, res) => {
  // 1. Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { code } = req.body;

  try {
    // --- 1. Exchange the code for an access token ---
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      null, // No body
      {
        params: {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
        },
        headers: {
          'Accept': 'application/json' // GitHub requires this header
        }
      }
    );

    const { access_token } = tokenResponse.data;
    if (!access_token) {
      return res.status(500).json({ message: 'GitHub auth failed: No token received.' });
    }

    // --- 2. Get the user's profile from GitHub ---
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const profile = userResponse.data;

    // --- 3. CRITICAL: Check if email is public ---
    if (!profile.email) {
      // If email is private, we can't create an account.
      // We must ask the user to make it public.
      return res.status(400).json({ 
        message: 'GitHub login failed: Your GitHub email is private. Please set a public email in your GitHub profile settings and try again.' 
      });
    }

    // --- 4. Find or Create User ---
    let user = await User.findOne({ 'providers.githubId': profile.id });

    if (!user) {
      // User not found by githubId. Let's check by email.
      user = await User.findOne({ email: profile.email });

      if (user) {
        // User with this email already exists! Link the accounts.
        user.providers.githubId = profile.id;
        await user.save();
      } else {
        // No user found at all. Create a new one.
        user = new User({
          email: profile.email,
          name: profile.name || profile.login, // Use name, fallback to login
          providers: {
            githubId: profile.id
          }
          // 'role' will be set to 'user' by default
        });
        await user.save();
      }
    }

    // --- 5. Create our app's JWTs (Same as Google) ---
    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    // Create the Access Token (15 minutes)
    const accessToken = jwt.sign(
      userPayload, 
      process.env.JWT_ACCESS_SECRET, 
      { expiresIn: process.env.JWT_ACCESS_EXPIRATION }
    );

    // Create the Refresh Token (7 days)
    const refreshToken = jwt.sign(
      userPayload,
      process.env.JWT_REFRESH_SECRET, 
      { expiresIn: process.env.JWT_REFRESH_EXPIRATION }
    );

    // Set the refresh token as an httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // Set to true in prod
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Send the access token in the JSON response
    res.status(200).json({ 
      message: 'Login successful',
      accessToken: accessToken
    });

  } catch (err) {
    console.error('Error during GitHub auth:', err.response ? err.response.data : err.message);
    res.status(500).json({ message: 'Authentication failed.' });
  }
});

// ===================================
// ===   CSRF & PROTECTED ROUTES   ===
// ===================================
// We initialize CSRF protection *after* our /auth/google route
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// --- 3. The "Me" (Check Auth) Route ---
// This route is protected by 'protect' and 'csrfProtection'
app.get('/api/user/me', protect, (req, res) => {
  res.status(200).json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
    csrfToken: req.csrfToken() // Send the CSRF token
  });
});

// ===================================
// ===     REFRESH TOKEN ROUTE     ===
// ===================================
// This route is protected by CSRF but not 'protect'
// It does its own JWT verification.
app.post('/auth/refresh', authLimiter, (req, res) => {
  // 1. Get the refresh token from the httpOnly cookie
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided.' });
  }

  try {
    // 2. Verify the refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    // 3. The token is valid, so create a new *access* token
    const userPayload = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };

    const newAccessToken = jwt.sign(
      userPayload,
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRATION }
    );

    // 4. Send the new access token (and a new CSRF token)
    // The client will need a new CSRF token for its *next* request
    res.status(200).json({
      message: 'Access token refreshed',
      accessToken: newAccessToken,
      csrfToken: req.csrfToken() // Send a new CSRF token
    });

  } catch (err) {
    // If the refresh token is invalid or expired
    console.error('Error refreshing token:', err.message);
    return res.status(403).json({ message: 'Invalid refresh token.' });
  }
});

// --- 4. The "Admin-Only" Route ---
// Also protected by both
app.get('/api/admin/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Admin route to view audit logs
app.get('/api/admin/audit-logs', protect, admin, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = auditLogger.getRecentLogs(limit);
    res.status(200).json({ logs, total: logs.length });
  } catch (err) {
    console.error('Error fetching audit logs:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin route to view metrics
app.get('/api/admin/metrics', protect, admin, (req, res) => {
  try {
    const metrics = auditLogger.getMetrics();
    const blacklistSize = tokenBlacklist.size();
    res.status(200).json({ 
      authMetrics: metrics,
      blacklistedTokens: blacklistSize
    });
  } catch (err) {
    console.error('Error fetching metrics:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- 5. The "Logout" Route ---
app.post('/auth/logout', authLimiter, protect, (req, res) => {
  try {
    // Blacklist the current access token
    if (req.token) {
      // Get token expiration time
      const decoded = jwt.decode(req.token);
      const expiresIn = (decoded.exp * 1000) - Date.now();
      tokenBlacklist.add(req.token, expiresIn);
    }

    // Log the logout event
    auditLogger.logAuth({
      type: 'logout',
      userId: req.user.id,
      email: req.user.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err.message);
    res.status(500).json({ message: 'Logout failed' });
  }
});

// ===================================
// ===   ACCOUNT LINKING ROUTES    ===
// ===================================

// Get linked providers for current user
app.get('/api/user/providers', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const linkedProviders = {
      google: !!user.providers.googleId,
      github: !!user.providers.githubId,
      facebook: !!user.providers.facebookId
    };

    res.status(200).json({ providers: linkedProviders });
  } catch (err) {
    console.error('Error fetching providers:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Link a provider to existing account
app.post('/api/user/link/:provider', protect, async (req, res) => {
  const { provider } = req.params;
  const { code, verifier, nonce } = req.body;

  if (!['google', 'github', 'facebook'].includes(provider)) {
    return res.status(400).json({ message: 'Invalid provider' });
  }

  const correlationId = auditLogger.logAuth({
    type: 'link_account_attempt',
    provider,
    userId: req.user.id,
    email: req.user.email,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    success: false
  });

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let providerId;

    // Handle different providers
    if (provider === 'google') {
      if (!code || !verifier || !nonce) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', null, {
        params: {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code,
          code_verifier: verifier,
          grant_type: 'authorization_code',
          redirect_uri: 'http://localhost:3000/auth/callback',
        },
      });

      const { id_token } = tokenResponse.data;
      const profile = jwt.decode(id_token);
      
      if (profile.nonce !== nonce) {
        return res.status(401).json({ message: 'Invalid nonce' });
      }

      providerId = profile.sub;

      // Check if this Google account is already linked to another user
      const existingUser = await User.findOne({ 'providers.googleId': providerId });
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ message: 'This Google account is already linked to another user' });
      }

      user.providers.googleId = providerId;

    } else if (provider === 'github') {
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        null,
        {
          params: {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
          },
          headers: { 'Accept': 'application/json' }
        }
      );

      const { access_token } = tokenResponse.data;
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });

      providerId = userResponse.data.id;

      const existingUser = await User.findOne({ 'providers.githubId': providerId });
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ message: 'This GitHub account is already linked to another user' });
      }

      user.providers.githubId = providerId;

    } else if (provider === 'facebook') {
      const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          code,
          redirect_uri: 'http://localhost:3000/auth/callback',
        }
      });

      const { access_token } = tokenResponse.data;
      const userResponse = await axios.get('https://graph.facebook.com/me', {
        params: {
          fields: 'id,name,email',
          access_token
        }
      });

      providerId = userResponse.data.id;

      const existingUser = await User.findOne({ 'providers.facebookId': providerId });
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ message: 'This Facebook account is already linked to another user' });
      }

      user.providers.facebookId = providerId;
    }

    await user.save();

    auditLogger.logAuth({
      correlationId,
      type: 'link_account',
      provider,
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    res.status(200).json({ message: `${provider} account linked successfully` });

  } catch (err) {
    console.error(`Error linking ${provider}:`, err.message);
    auditLogger.logAuth({
      correlationId,
      type: 'link_account',
      provider,
      userId: req.user.id,
      email: req.user.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: false,
      errorMessage: err.message
    });
    res.status(500).json({ message: 'Account linking failed' });
  }
});

// Unlink a provider from account
app.delete('/api/user/unlink/:provider', protect, async (req, res) => {
  const { provider } = req.params;

  if (!['google', 'github', 'facebook'].includes(provider)) {
    return res.status(400).json({ message: 'Invalid provider' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Count how many providers are linked
    const linkedCount = [
      user.providers.googleId,
      user.providers.githubId,
      user.providers.facebookId
    ].filter(Boolean).length;

    // Don't allow unlinking if it's the last provider
    if (linkedCount <= 1) {
      return res.status(400).json({ 
        message: 'Cannot unlink the last authentication provider. Link another provider first.' 
      });
    }

    // Unlink the provider
    if (provider === 'google') {
      user.providers.googleId = undefined;
    } else if (provider === 'github') {
      user.providers.githubId = undefined;
    } else if (provider === 'facebook') {
      user.providers.facebookId = undefined;
    }

    await user.save();

    auditLogger.logAuth({
      type: 'unlink_account',
      provider,
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    res.status(200).json({ message: `${provider} account unlinked successfully` });

  } catch (err) {
    console.error(`Error unlinking ${provider}:`, err.message);
    res.status(500).json({ message: 'Account unlinking failed' });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});