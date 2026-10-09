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
            // 
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

module.exports = { createBookingWithTransaction };

// Mongoose. n.d. Transactions in Mongoose. [online] Available at: https://mongoosejs.com/docs/transactions.html (Accessed: 9 October 2026).
