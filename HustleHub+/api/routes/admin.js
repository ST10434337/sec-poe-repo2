const express = require('express');
const router = express.Router();
const { allowRoles } = require('../middleware/auth');
const { ROLES } = require('../utils/roles');

const {
    getUsers,
    updateUserStatus,
    deleteGigAsAdmin
} = require('../controllers/adminController');

// Every admin route checks the token and the admin role ~> (The IIE, 2026)

// List users (passwords are never returned)
router.get('/users', allowRoles(ROLES.ADMIN), getUsers);

// Enable or disable a user account; an admin cannot disable themselves
router.patch('/users/:id/status', allowRoles(ROLES.ADMIN), updateUserStatus);

// Moderation: soft delete any gig
router.delete('/gigs/:id', allowRoles(ROLES.ADMIN), deleteGigAsAdmin);

module.exports = router;
//The Independent Institute of Education (IIE). 2026. Information Systems 3D (INSY7314/w): Module manual. The Independent Institute of Education (Pty) Ltd.
