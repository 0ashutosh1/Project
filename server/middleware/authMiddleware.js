const jwt = require('jsonwebtoken');

// --- 1. Middleware to check if user is logged in ---
// This middleware now looks for a Bearer Token in the Authorization header
const protect = (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  // Check for the 'Authorization' header and that it's a 'Bearer' token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // 1. Get the token from the header (e.g., "Bearer <token>")
      token = authHeader.split(' ')[1];

      // 2. Verify the access token
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      // 3. Add the user payload to the request object
      // We don't fetch from DB, we trust the token payload
      req.user = decoded;
      
      // 4. Call the next function
      next();

    } catch (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// --- 2. Middleware to check if user is an Admin ---
// (This function is unchanged)
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };