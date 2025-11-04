const jwt = require('jsonwebtoken');

// --- 1. Middleware to check if user is logged in ---
// We're moving the logic from /api/user/me into its own middleware
// so we can reuse it.
const protect = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add the user payload to the request object
    req.user = decoded;
    
    // Call the next function in the stack
    next(); 

  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// --- 2. Middleware to check if user is an Admin ---
// This middleware must run *after* the 'protect' middleware
const admin = (req, res, next) => {
  // We check the req.user object that the 'protect' middleware added
  if (req.user && req.user.role === 'admin') {
    next(); // User is an admin, proceed
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' }); // 403 Forbidden
  }
};

module.exports = { protect, admin };