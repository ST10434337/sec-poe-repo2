const mongoose = require('mongoose');
// Function to connect to the MongoDB database ~> (The IIE, 2026)
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
//The Independent Institute of Education (IIE) (2026) Information Systems 3D (INSY7314/w): 
//  Module manual. The Independent Institute of Education (Pty) Ltd. 