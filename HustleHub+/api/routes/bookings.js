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


const bookingWriteLimit = rateLimit.rateLimiter(25, 15, 'booking-write');
const bookingReadLimit = rateLimit.rateLimiter(60, 15, 'booking-read');

// Browsing gigs is public, but booking one needs login and the client role ~> (The IIE, 2026)
router.post('/', bookingWriteLimit, allowRoles(ROLES.CLIENT), createBooking);

// Clients see the bookings they made
router.get('/my-bookings', bookingReadLimit, allowRoles(ROLES.CLIENT), getMyBookings);

// Freelancers see the bookings made on their gigs
router.get('/freelancer',bookingReadLimit, allowRoles(ROLES.FREELANCER), getFreelancerBookings);

// View one booking. Only the booking's client, freelancer, or an admin can access it
router.get('/:id',bookingReadLimit, allowRoles(ROLES.CLIENT, ROLES.FREELANCER, ROLES.ADMIN), getBookingById);

// Freelancers move their own bookings forward: confirmed -> in_progress -> completed
router.patch('/:id/status', bookingWriteLimit, allowRoles(ROLES.FREELANCER), updateBookingStatus);

// Clients cancel their own booking while it is still confirmed
router.patch('/:id/cancel', bookingWriteLimit, allowRoles(ROLES.CLIENT), cancelBooking);

module.exports = router;
//The Independent Institute of Education (IIE). 2026. Information Systems 3D (INSY7314/w): Module manual. The Independent Institute of Education (Pty) Ltd.
