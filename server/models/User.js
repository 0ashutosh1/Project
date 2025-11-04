const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: {
    type: String
  },

  // --- THIS IS THE NEW PART ---
  role: {
    type: String,
    enum: ['user', 'admin'], // Restricts the value to 'user' or 'admin'
    default: 'user'          // Automatically sets new users to 'user'
  },
  // --- END NEW PART ---

  providers: {
    googleId: {
      type: String,
      sparse: true,
      unique: true
    },
    facebookId: {
      type: String,
      sparse: true,
      unique: true
    }
  }
}, {
  timestamps: true 
});

const User = mongoose.model('User', userSchema);

module.exports = User;