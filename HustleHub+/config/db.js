const mongoose = require('mongoose');
// Function to connect to the MongoDB database
const connectDB = async () => {
  try {
    // Connect to the MongoDB database using the connection string from environment variables
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('MongoDB connected');
  } catch (err) {
    // Log any connection errors and exit the process
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;