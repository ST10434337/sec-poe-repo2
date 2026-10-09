const express = require('express');
const router = express.Router();
const { requireAuth, allowRoles } = require('../middleware/auth');
const { ROLES } = require('../utils/roles');

const {
    registerUser,
    loginUser,
    getCurrentUser,
    becomeFreelancer,
    updateUserRole
} = require('../controllers/authController');


// Register and login are public. A user is not logged in yet ~> (The IIE, 2026)
router.post('/register', registerUser);
router.post('/login', loginUser);

// Example: get current user (protected)
router.get('/me', getCurrentUser);

// Logged-in clients can upgrade themselves to freelancer.
// Including FREELANCER makes the route safe to call again after upgrading.
router.post('/become-freelancer', allowRoles(ROLES.CLIENT, ROLES.FREELANCER), becomeFreelancer);

// Admin can update user roles (protected)
router.patch('/users/:userId/role',allowRoles(ROLES.ADMIN), updateUserRole);

module.exports = router;
//The Independent Institute of Education (IIE) (2026) Information Systems 3D (INSY7314/w): 
//  Module manual. The Independent Institute of Education (Pty) Ltd. 