const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleAuth');
const { ROLES } = require('../utils/roles');

const {
    createBooking,
    getMyBookings,
    getFreelancerBookings,
    getBookingById,
    updateBookingStatus,
    cancelBooking
} = require('../controllers/bookingController');

// Browsing gigs is public, but booking one needs login and the client role ~> (The IIE, 2026)
router.post('/', requireAuth, allowRoles(ROLES.CLIENT), createBooking);

// Clients see the bookings they made
router.get('/my-bookings', requireAuth, allowRoles(ROLES.CLIENT), getMyBookings);

// Freelancers see the bookings made on their gigs
router.get('/freelancer', requireAuth, allowRoles(ROLES.FREELANCER), getFreelancerBookings);

// View one booking. Only the booking's client, freelancer, or an admin can access it
router.get('/:id', requireAuth, allowRoles(ROLES.CLIENT, ROLES.FREELANCER, ROLES.ADMIN), getBookingById);

// Freelancers move their own bookings forward: confirmed -> in_progress -> completed
router.patch('/:id/status', requireAuth, allowRoles(ROLES.FREELANCER), updateBookingStatus);

// Clients cancel their own booking while it is still confirmed
router.patch('/:id/cancel', requireAuth, allowRoles(ROLES.CLIENT), cancelBooking);

module.exports = router;
//The Independent Institute of Education (IIE). 2026. Information Systems 3D (INSY7314/w): Module manual. The Independent Institute of Education (Pty) Ltd.
