const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const user = await User.create({ email, password, name });
    const token = generateToken(user._id);
    res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    // Validate input
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    // Check if user exists and password matches
    const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Generate token and send response
    const token = generateToken(user._id);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    // Handle errors
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Example: get current user (protected)
router.get('/me', require('../middleware/auth'), async (req, res) => {
  // Fetch user data without password
  const user = await User.findById(req.userId).select('-password');
  res.json(user);
});

module.exports = router;