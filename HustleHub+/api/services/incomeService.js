const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { TRANSACTION_STATUS } = require('../utils/statuses');
const { getTaxTable } = require('../config/taxTables');
const { getTaxYear, buildTaxSummary } = require('./taxService');

// Group payments by the month they were paid in South Africa, not in UTC
const SA_TIMEZONE = 'Africa/Johannesburg';

// Total a freelancer's transactions by status ~> (MongoDB, n.d.a)
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

// Build the freelancer's tax estimate for the tax year `now` is in (see services/taxService.js)
// Paid income = completed transactions. A transaction is only changed once, when it leaves pending,
// so a completed transaction's updatedAt is the day it was paid
const getFreelancerTaxSummary = async (freelancerId, now = new Date()) => {
    const taxYear = getTaxYear(now);
    // aggregate() does not cast ids automatically, so convert the string id to ObjectId
    const freelancer = new mongoose.Types.ObjectId(freelancerId);

    const [monthlyRows, pendingRows] = await Promise.all([
        // Paid income in this tax year, added up per month ~> (MongoDB, n.d.b)
        Transaction.aggregate([
            {
                $match: {
                    freelancer,
                    status: TRANSACTION_STATUS.COMPLETED,
                    updatedAt: { $gte: taxYear.start, $lt: taxYear.end },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$updatedAt', timezone: SA_TIMEZONE } },
                    earned: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]),

        // Money from bookings that are not paid yet (any date)
        Transaction.aggregate([
            { $match: { freelancer, status: TRANSACTION_STATUS.PENDING } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
    ]);

    return buildTaxSummary({
        taxYear,
        table: getTaxTable(taxYear.year),
        monthlyRows: monthlyRows.map((row) => ({ month: row._id, earned: row.earned, count: row.count })),
        pending: pendingRows[0]?.total ?? 0,
        now,
    });
};

module.exports = { getFreelancerIncome, getFreelancerTaxSummary };

// MongoDB. n.d.a. $group (aggregation stage). [online]. Available at: https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/. [Accessed 9 October 2026].
// MongoDB. n.d.b. $dateToString (aggregation operator). [online]. Available at: https://www.mongodb.com/docs/manual/reference/operator/aggregation/dateToString/. [Accessed 6 November 2026].
