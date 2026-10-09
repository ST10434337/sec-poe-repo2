const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { TRANSACTION_STATUS } = require('../utils/statuses');

// Total a freelancer's transactions by status ~> (MongoDB, n.d.)
//  earned   = completed bookings (payment released to the freelancer)
//  pending  = bookings that are confirmed or in progress
//  refunded = cancelled bookings

// Build the freelancers income summary from their transaction records
const getFreelancerIncome = async (freelancerId) => {
    const totals = await Transaction.aggregate([
        // Only include transactions where this user was the freelancer
        // aggregate() does not cast ids automatically, so convert the string id to ObjectId
        { $match: { freelancer: new mongoose.Types.ObjectId(freelancerId) } },
        
        // Group matching transactions by Status & total amount in each group
        { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    // Convert the grouped rows into an object so each status is easy to look up
    const byStatus = Object.fromEntries(totals.map((row) => [row._id, row]));

    // If a status has no transactions yet, return 0 instead of undefined
    const totalFor = (status) => byStatus[status]?.total ?? 0;

    return {
        currency: 'ZAR',
        earned: totalFor(TRANSACTION_STATUS.COMPLETED),
        pending: totalFor(TRANSACTION_STATUS.PENDING), 
        refunded: totalFor(TRANSACTION_STATUS.REFUNDED),
        completedCount: byStatus[TRANSACTION_STATUS.COMPLETED]?.count ?? 0,
    };
};

module.exports = { getFreelancerIncome };

// MongoDB. n.d. $group (aggregation stage). [online] Available at: https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/ (Accessed: 9 October 2026).
