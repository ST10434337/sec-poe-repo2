const mongoose = require('mongoose');
const Gig = require('../models/Gig');
const Booking = require('../models/Booking');
const { createBookingWithTransaction } = require('../services/bookingService');
const { parsePagination, pageInfo } = require('../utils/pagination');

// POST /api/bookings - a client books an active gig, which also creates its transaction
const createBooking = async (req, res) => {
    // Only gigId is read from the body; client, freelancer, price and status are set by the server
    const { gigId } = req.body || {};
    if (!mongoose.isObjectIdOrHexString(gigId))
        return res.status(400).json({ message: 'Invalid gig id' });

    const gig = await Gig.findById(gigId);
    if (!gig || !gig.isActive)
        return res.status(404).json({ message: 'Gig not found' });

    // Roles already stop freelancers from booking, but never allow booking your own gig
    if (gig.freelancer.equals(req.userId))
        return res.status(400).json({ message: 'You cannot book your own gig' });

    const { booking, transaction } = await createBookingWithTransaction(req.userId, gig);
    res.status(201).json({ booking, transaction });
};

// GET /api/bookings/my-bookings - the logged-in client's bookings, newest first
const getMyBookings = async (req, res) => {
    const filter = { client: req.userId };

    const { page, limit, skip } = parsePagination(req.query);
    const [bookings, total] = await Promise.all([
        Booking.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('gig', 'title category')
            .populate('freelancer', 'name'), // name only, never the freelancer's email
        Booking.countDocuments(filter),
    ]);

    res.json({ bookings, ...pageInfo(page, limit, total) });
};

// GET /api/bookings/freelancer - bookings on the logged-in freelancer's gigs, newest first
const getFreelancerBookings = async (req, res) => {
    const filter = { freelancer: req.userId };

    const { page, limit, skip } = parsePagination(req.query);
    const [bookings, total] = await Promise.all([
        Booking.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('gig', 'title category')
            .populate('client', 'name'), // name only, never the client's email
        Booking.countDocuments(filter),
    ]);

    res.json({ bookings, ...pageInfo(page, limit, total) });
};

module.exports = {
    createBooking,
    getMyBookings,
    getFreelancerBookings
};
