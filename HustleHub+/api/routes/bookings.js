const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleAuth');
const { ROLES } = require('../utils/roles');

const {
    createBooking,
    getMyBookings,
    getFreelancerBookings
} = require('../controllers/bookingController');

// Browsing gigs is public, but booking one needs login and the client role ~> (The IIE, 2026)
router.post('/', requireAuth, allowRoles(ROLES.CLIENT), createBooking);

// Clients see the bookings they made
router.get('/my-bookings', requireAuth, allowRoles(ROLES.CLIENT), getMyBookings);

// Freelancers see the bookings made on their gigs
router.get('/freelancer', requireAuth, allowRoles(ROLES.FREELANCER), getFreelancerBookings);

module.exports = router;
//The Independent Institute of Education (IIE). 2026. Information Systems 3D (INSY7314/w): Module manual. The Independent Institute of Education (Pty) Ltd.
