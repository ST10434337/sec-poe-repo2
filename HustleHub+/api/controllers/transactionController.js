const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { getFreelancerIncome } = require('../services/incomeService');
const { parsePagination, pageInfo } = require('../utils/pagination');
const { ROLES } = require('../utils/roles');

const logger = require('../utils/logger');
const transLogger = logger.child({ tag: 'TRANSACTIONS' });
const userId = require('../utils/logUtils');

// Get the booking status, gig title and both parties names 
const withDetails = (query) => query
    .populate({ path: 'booking', select: 'status gig', populate: { path: 'gig', select: 'title' } })
    .populate('client', 'name')
    .populate('freelancer', 'name');

// One page of transactions matching the filter, newest first
const findTransactionsPage = async (filter, query) => {
    const { page, limit, skip } = parsePagination(query);
    const [transactions, total] = await Promise.all([
        withDetails(Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
        Transaction.countDocuments(filter),
    ]);
    transLogger.info(`Transactions page accessed - page ${page}, limit ${limit}, total ${total}`);
    return { transactions, ...pageInfo(page, limit, total) };
};

// GET /api/transactions/my-transactions - payments a client made, or payments a freelancer received
const getMyTransactions = async (req, res) => {
    // The route only allows clients and freelancers, so the caller is on one side of each transaction
    const filter = req.userRole === ROLES.FREELANCER
        ? { freelancer: req.userId }
        : { client: req.userId };

    transLogger.info(`User ${userId} accessed their transactions`);
    res.json(await findTransactionsPage(filter, req.query));
};

// GET /api/transactions/income - the logged-in freelancers totals by status
const getIncome = async (req, res) => {
    transLogger.info(`Freelancer ${req.userId} accessed their income summary`);
    res.json(await getFreelancerIncome(req.userId));
};

// GET /api/transactions/:id - one transaction, for either party or an admin
const getTransactionById = async (req, res) => {
    // reject malformed ids before querying MongoDB
    if (!mongoose.isObjectIdOrHexString(req.params.id))
        return res.status(400).json({ message: 'Invalid transaction id' });

    // Non-admins must be on the transaction; anyone else gets the same 404 as a missing one
    const filter = { _id: req.params.id };
    if (req.userRole !== ROLES.ADMIN)
        filter.$or = [{ client: req.userId }, { freelancer: req.userId }];

    const transaction = await withDetails(Transaction.findOne(filter));
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    transLogger.info(`Transaction ${transaction._id} accessed by user ${userId}`);
    res.json({ transaction });
};

// GET /api/transactions - every transaction, for admins
const listTransactions = async (req, res) => {
    transLogger.info(`Admin ${req.userId} accessed all transactions - page ${req.query.page || 1}, limit ${req.query.limit || 10}`);
    res.json(await findTransactionsPage({}, req.query));
};

module.exports = {
    getMyTransactions,
    getIncome,
    getTransactionById,
    listTransactions
};
