const mongoose = require('mongoose');
const Gig = require('../models/Gig');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const { createBookingWithTransaction, changeBookingStatus } = require('../services/bookingService');
const { parsePagination, pageInfo } = require('../utils/pagination');
const { ROLES } = require('../utils/roles');
const { BOOKING_STATUS, TRANSACTION_STATUS } = require('../utils/statuses');

// Freelancer status flow: confirmed can only move to in progress, and in progress can only move to completed 
const FREELANCER_NEXT_STATUS = {
    [BOOKING_STATUS.CONFIRMED]: BOOKING_STATUS.IN_PROGRESS,
    [BOOKING_STATUS.IN_PROGRESS]: BOOKING_STATUS.COMPLETED,
};

const UPDATED_ELSEWHERE = 'Booking was updated by another request. Refresh and try again'; // 409 msg

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

// GET /api/bookings/:id - one booking and its transaction, for its client, its freelancer or an admin
const getBookingById = async (req, res) => {
    // Reject malformed ids before querying MongoDB
    if (!mongoose.isObjectIdOrHexString(req.params.id))
        return res.status(400).json({ message: 'Invalid booking id' });

    // Start with the booking id from the URL
    const filter = { _id: req.params.id };
    // Admins may view any booking; clients/freelancers only see bookings they are part of
    if (req.userRole !== ROLES.ADMIN)
        filter.$or = [{ client: req.userId }, { freelancer: req.userId }];

    const booking = await Booking.findOne(filter)
        .populate('gig', 'title category')
        .populate('client', 'name') // names only, never emails
        .populate('freelancer', 'name');

    // Missing booking, or a booking that does not belong to this user    
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Include the matching payment record so the detail page has booking and payment info together
    const transaction = await Transaction.findOne({ booking: booking._id })
        .select('reference status amount currency paymentMethod createdAt updatedAt');

    res.json({ booking, transaction });
};

// PATCH /api/bookings/:id/status - the freelancer moves their own booking one step forward
const updateBookingStatus = async (req, res) => {
    // Like before, reject malformed ids before querying MongoDB
    if (!mongoose.isObjectIdOrHexString(req.params.id))
        return res.status(400).json({ message: 'Invalid booking id' });

    const { status } = req.body || {};
    if (status !== BOOKING_STATUS.IN_PROGRESS && status !== BOOKING_STATUS.COMPLETED)
        return res.status(400).json({ message: 'Status must be in_progress or completed' });

    // Find only bookings owned by this freelancer; other users' bookings stay hidden as 404
    const booking = await Booking.findOne({ _id: req.params.id, freelancer: req.userId });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Enforce status flow lifecycle: confirmed -> in_progress -> completed
    if (FREELANCER_NEXT_STATUS[booking.status] !== status)
        return res.status(400).json({ message: `Cannot change a booking from ${booking.status} to ${status}` });

    // Completing the work releases the payment to the freelancer; starting it keeps the payment pending
    const transactionStatus = status === BOOKING_STATUS.COMPLETED ? TRANSACTION_STATUS.COMPLETED : null;

    const result = await changeBookingStatus(booking._id, booking.status, status, transactionStatus);
    // If another request changed the booking after it was loaded here, asks client to refresh
    if (!result.booking) return res.status(409).json({ message: UPDATED_ELSEWHERE });

    res.json(result);
};

// PATCH /api/bookings/:id/cancel - the client cancels their own booking before work starts
const cancelBooking = async (req, res) => {
    // Like before, reject malformed ids before querying MongoDB
    if (!mongoose.isObjectIdOrHexString(req.params.id))
        return res.status(400).json({ message: 'Invalid booking id' });

    // The reason is optional, but if sent it must be plain text
    const { reason } = req.body || {};
    if (reason != null && typeof reason !== 'string')
        return res.status(400).json({ message: 'Reason must be text' });

    // Find only bookings made by this client; other users' bookings stay hidden as 404
    const booking = await Booking.findOne({ _id: req.params.id, client: req.userId });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // A booking can only be cancelled before work has started
    if (booking.status !== BOOKING_STATUS.CONFIRMED)
        return res.status(400).json({ message: 'Only confirmed bookings can be cancelled' });

    // Store the reason only when the client actually typed one
    const extraFields = reason && reason.trim() ? { cancellationReason: reason } : {};

    const result = await changeBookingStatus(
        booking._id, 
        BOOKING_STATUS.CONFIRMED, 
        BOOKING_STATUS.CANCELLED, 
        TRANSACTION_STATUS.REFUNDED, 
        extraFields
    );
    // Another request changed the booking after we loaded it, so ask the client to refresh
    if (!result.booking) return res.status(409).json({ message: UPDATED_ELSEWHERE });

    res.json(result);
};

module.exports = {
    createBooking,
    getMyBookings,
    getFreelancerBookings,
    getBookingById,
    updateBookingStatus,
    cancelBooking
};
