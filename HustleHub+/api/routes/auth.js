const express = require('express');
const router = express.Router();

const {
    registerUser,
    loginUser,
    getCurrentUser,
    becomeFreelancer,
    updateUserRole
} = require('../controllers/authController');

const { requireAuth, allowRoles } = require('../middleware/auth');
const { ROLES } = require('../utils/roles');

// Register route ~> (The IIE, 2026)
router.post('/register', registerUser);

// Login route ~> (The IIE, 2026)
router.post('/login', loginUser);

// Example: get current user (protected)
router.get('/me', requireAuth, getCurrentUser);

// Authenticated clients can upgrade their own account.
router.post('/become-freelancer', requireAuth, becomeFreelancer);

// Admin can update user roles (protected)
router.patch('/users/:userId/role', allowRoles(ROLES.ADMIN), updateUserRole);

module.exports = router;
//The Independent Institute of Education (IIE) (2026) Information Systems 3D (INSY7314/w): 
//  Module manual. The Independent Institute of Education (Pty) Ltd. 