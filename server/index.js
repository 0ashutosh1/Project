const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken'); // <-- 1. Import jsonwebtoken
require('./passportConfig'); // Import your passport config


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
      name: req.user.name
    };

    // 2. Sign the token
    // We need to add a JWT_SECRET to our .env file
    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' } // Token expires in 1 day
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
// A protected route to get the current user's info
// We'll create a middleware for this later, but let's test it
app.get('/api/user/me', (req, res) => {
  try {
    // 1. Get the token from the cookies
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // 2. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. 'decoded' is the payload we set: { id, email, name }
    // Send the user info back to the client
    res.status(200).json({
      id: decoded.id,
      email: decoded.email,
      name: decoded.name
    });

  } catch (err) {
    // If token is invalid or expired
    return res.status(401).json({ message: 'Invalid token' });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});