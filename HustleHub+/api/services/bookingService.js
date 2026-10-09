const crypto = require('crypto');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const { BOOKING_STATUS, TRANSACTION_STATUS } = require('../utils/statuses');

// Create a booking and its simulated payment in one MongoDB transaction
// Either both are saved or neither are 
// Thus, a booking can never be created without a transaction ~> (Mongoose, n.d.)
const createBookingWithTransaction = async (clientId, gig) => {
    const session = await mongoose.startSession();
    try {
        let booking, transaction;

        await session.withTransaction(async () => {
            // Create booking from same session
            [booking] = await Booking.create([{
                client: clientId,
                freelancer: gig.freelancer,
                gig: gig._id,
                price: gig.price,
                status: BOOKING_STATUS.CONFIRMED,
            }], { session });

            // Create matching simulated payment for this booking
            [transaction] = await Transaction.create([{
                booking: booking._id,
                client: clientId,
                freelancer: gig.freelancer,
                amount: booking.price,
                status: TRANSACTION_STATUS.PENDING,
                paymentMethod: 'simulated',
                reference: `Ref-${crypto.randomUUID()}`,
            }], { session });
        });

        return { booking, transaction };
    } finally {
        // Close session after transaction try
        await session.endSession();
    }
};

// Update the booking and its transaction in the same MongoDB transaction ~> (Mongoose, n.d.)
// This keeps the booking status and payment status in sync
const changeBookingStatus = async (bookingId, fromStatus, toStatus, transactionStatus, extraFields = {}) => {
    const session = await mongoose.startSession();
    try {
        let booking, transaction;

        await session.withTransaction(async () => {
            // Update only is booking is still in the status that the controller checked
            // If another request changed it 1st, this returns null and controller sends 409
            booking = await Booking.findOneAndUpdate(
                { _id: bookingId, status: fromStatus },
                { status: toStatus, ...extraFields },
                { returnDocument: 'after', runValidators: true, session }
            );

            if (!booking) return;

            // Move the payment out of pending, or just read it when its status does not change
            transaction = transactionStatus
                ? await Transaction.findOneAndUpdate(
                    { booking: booking._id, status: TRANSACTION_STATUS.PENDING },
                    { status: transactionStatus },
                    { returnDocument: 'after', runValidators: true, session }
                )
                : await Transaction.findOne({ booking: booking._id }).session(session);

            // Every booking must have a matching transaction; throwing here also rolls back the booking change
            if (!transaction) throw new Error('Transaction missing or not pending for booking');
        });

        return { booking, transaction };
    } finally {
        await session.endSession();
    }
};

module.exports = { createBookingWithTransaction, changeBookingStatus };

// Mongoose. n.d. Transactions in Mongoose. [online] Available at: https://mongoosejs.com/docs/transactions.html (Accessed: 9 October 2026).
