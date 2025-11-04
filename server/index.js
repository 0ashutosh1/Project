const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { protect, admin } = require('./middleware/authMiddleware'); // <-- 1. ADD THIS
const User = require('./models/User'); // <-- 2. ADD THIS
require('./passportConfig');


const app = express();
const PORT = process.env.PORT || 5000;

// --- Middlewares ---
// Your React app will be on http://localhost:3000
// 'credentials: true' allows the browser to send/receive cookies
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser()); // Use cookie-parser
app.use(passport.initialize()); // Initialize passport

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Successfully connected to MongoDB!"))
  .catch((error) => console.error("❌ Error connecting to MongoDB:", error.message));

// --- Basic Test Route ---
app.get('/api', (req, res) => {
  res.json({ message: "Hello from the Nimbus server!" });
});


// ===================================
// ===         AUTH ROUTES         ===
// ===================================

// --- 1. The "Login" Route ---
// This route starts the Google login process
app.get('/auth/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'], // We want to get the user's profile and email
    session: false // We're using JWTs, not sessions
  })
);

// --- 2. The "Callback" Route ---
// This is the URL Google redirects to after a successful login
app.get('/auth/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:3000/login?error=true', // Redirect to React login page on failure
    session: false // Still no sessions
  }), 
  (req, res) => {
    // --- User is authenticated! (req.user is populated by passport) ---

    // 1. Create the JWT payload
    const payload = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role // <-- ADD THIS LINE
    };

    // 2. Sign the token
    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    // 3. Send the token as an httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true, // Makes it inaccessible to client-side JS (prevents XSS)
      secure: false, // Set to true if you're on HTTPS in production
      sameSite: 'strict', // Helps prevent CSRF
      maxAge: 24 * 60 * 60 * 1000 // 1 day (in milliseconds)
    });

    // 4. Redirect the user back to the React app's profile page
    res.redirect('http://localhost:3000/profile');
  }
);

// --- 3. The "Me" (Check Auth) Route ---
// We add 'protect' as the second argument. It runs *before* the (req, res) function.
app.get('/api/user/me', protect, (req, res) => {
  // If the code reaches this point, 'protect' has already verified
  // the token and added the user's data to 'req.user'.

  res.status(200).json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role
  });
});

// --- 4. The "Admin-Only" Route ---
// This route uses *both* middlewares. They run in order.
// 1st: 'protect' checks for a valid login token.
// 2nd: 'admin' checks if req.user.role === 'admin'.
app.get('/api/admin/users', protect, admin, async (req, res) => {
  try {
    // If we get here, the user is a logged-in admin.
    // Let's find all users in the database.
    const users = await User.find({}); // {} means "find all"
    res.status(200).json(users);

  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- 5. The "Logout" Route ---
app.post('/auth/logout', (req, res) => {
  // We clear the cookie by its name 'token'
  res.clearCookie('token', {
    httpOnly: true,
    secure: false, // Set to true in production (HTTPS)
    sameSite: 'strict',
  });
  
  // Send a success response
  res.status(200).json({ message: 'Logged out successfully' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});