const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const { registerUser, loginUser, getCurrentUser } = require('../controllers/authController');

const {requireAuth, authorisedRoles} = require('../middleware/auth')

// Register route ~> (The IIE, 2026)
router.post('/register', registerUser);

// Login route ~> (The IIE, 2026)
router.post('/login', loginUser);

// Example: get current user (protected)
router.get('/me', requireAuth, getCurrentUser);

module.exports = router;
//The Independent Institute of Education (IIE) (2026) Information Systems 3D (INSY7314/w): 
//  Module manual. The Independent Institute of Education (Pty) Ltd. 