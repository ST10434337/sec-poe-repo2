const express = require('express');
const router = express.Router();
const { allowRoles } = require('../middleware/auth');
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
router.post('/', allowRoles(ROLES.CLIENT), createBooking);

// Clients see the bookings they made
router.get('/my-bookings', allowRoles(ROLES.CLIENT), getMyBookings);

// Freelancers see the bookings made on their gigs
router.get('/freelancer', allowRoles(ROLES.FREELANCER), getFreelancerBookings);

// View one booking. Only the booking's client, freelancer, or an admin can access it
router.get('/:id', allowRoles(ROLES.CLIENT, ROLES.FREELANCER, ROLES.ADMIN), getBookingById);

// Freelancers move their own bookings forward: confirmed -> in_progress -> completed
router.patch('/:id/status', allowRoles(ROLES.FREELANCER), updateBookingStatus);

// Clients cancel their own booking while it is still confirmed
router.patch('/:id/cancel', allowRoles(ROLES.CLIENT), cancelBooking);

module.exports = router;
//The Independent Institute of Education (IIE). 2026. Information Systems 3D (INSY7314/w): Module manual. The Independent Institute of Education (Pty) Ltd.
