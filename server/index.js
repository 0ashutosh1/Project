const dotenv = require('dotenv');
dotenv.config(); // Must be at the very top

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const csrf = require('csurf');
const axios = require('axios'); // <-- Our new http client
const { protect, admin } = require('./middleware/authMiddleware');
const User = require('./models/User');

// --- Removed all passport imports ---

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middlewares ---
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());
// --- Removed passport.initialize() ---

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
// This is our new endpoint to handle the PKCE flow
// It is *not* protected by CSRF, which is safe because
// an attacker cannot forge the 'code' and 'verifier'.
app.post('/auth/google', async (req, res) => {
  const { code, verifier } = req.body;

  if (!code || !verifier) {
    return res.status(400).json({ message: 'Code and verifier are required.' });
  }

  try {
    // --- 1. Exchange the code for tokens ---
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        code_verifier: verifier,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:3000/auth/callback', // Must match client
      },
    });

    const { access_token, id_token } = tokenResponse.data;

    // --- 2. Get user profile from the id_token ---
    // The id_token is a JWT signed by Google. We can decode it.
    const profile = jwt.decode(id_token);
    if (!profile) {
      return res.status(400).json({ message: 'Invalid ID token' });
    }

    // --- 3. Find or Create User ---
    // This is the same logic we had in passportConfig.js
    let user = await User.findOne({ 'providers.googleId': profile.sub }); // 'sub' is Google's unique ID

    if (!user) {
      // Create a new user if they don't exist
      user = new User({
        email: profile.email,
        name: profile.name,
        // 'role' will be set to 'user' by default from our schema
        providers: {
          googleId: profile.sub
        }
      });
      await user.save();
    }

    // --- 4. Create *our* app's JWT (the session) ---
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    // --- 5. Set the httpOnly cookie ---
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true if on HTTPS
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // --- 6. Send success response ---
    // The client will receive this and redirect to /profile
    res.status(200).json({ message: 'Login successful' });

  } catch (err) {
    console.error('Error during Google auth:', err.response ? err.response.data : err.message);
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

// --- 5. The "Logout" Route ---
// Also protected by both
app.post('/auth/logout', protect, (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
  });
  res.status(200).json({ message: 'Logged out successfully' });
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});