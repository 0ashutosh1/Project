// Quick script to view all users in the database
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const viewUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fetch all users
    const users = await User.find({});
    
    if (users.length === 0) {
      console.log('❌ No users found in database.');
      console.log('💡 Tip: Login with OAuth to create a user.');
    } else {
      console.log(`📊 Found ${users.length} user(s):\n`);
      users.forEach((user, index) => {
        console.log(`--- User ${index + 1} ---`);
        console.log(`ID: ${user._id}`);
        console.log(`Name: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Avatar: ${user.avatar || 'No avatar'}`);
        console.log(`Providers:`, {
          Google: user.providers.googleId ? '✅' : '❌',
          GitHub: user.providers.githubId ? '✅' : '❌',
          Facebook: user.providers.facebookId ? '✅' : '❌'
        });
        console.log(`Last Login: ${user.lastLogin}`);
        console.log(`Created: ${user.createdAt}`);
        console.log('');
      });
    }

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

viewUsers();
