const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { getFreelancerIncome, getFreelancerTaxSummary } = require('../services/incomeService');
const { parsePagination, pageInfo } = require('../utils/pagination');
const { ROLES } = require('../utils/roles');

const logger = require('../utils/logger');
const transLogger = logger.child({ tag: 'TRANSACTIONS' });
// User values are logged as their own fields, not inside the message text,
// so they can't add fake lines to the log ~> (SonarSource, n.d.; OWASP, n.d.)

// Get the booking status, gig title and both parties names 
const withDetails = (query) => query
    .populate({ path: 'booking', select: 'status gig', populate: { path: 'gig', select: 'title' } })
    .populate('client', 'name')
    .populate('freelancer', 'name');

// One page of transactions matching the filter, newest first
const findTransactionsPage = async (filter, query) => {
    try {
    const { page, limit, skip } = parsePagination(query);
    const [transactions, total] = await Promise.all([
        withDetails(Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
        Transaction.countDocuments(filter),
    ]);
    transLogger.info(`Transactions page accessed - page ${page}, limit ${limit}, total ${total}`);
    return { transactions, ...pageInfo(page, limit, total) };
    } catch (error) {
        transLogger.error(`Error fetching transactions page: ${error.message}`);
        throw error;
    }
};

// GET /api/transactions/my-transactions - payments a client made, or payments a freelancer received
const getMyTransactions = async (req, res) => {
    try{
    // The route only allows clients and freelancers, so the caller is on one side of each transaction
    const filter = req.userRole === ROLES.FREELANCER
        ? { freelancer: req.userId }
        : { client: req.userId };

    transLogger.info({ userId: req.userId }, 'User accessed their transactions');
    res.json(await findTransactionsPage(filter, req.query));
    } catch (error) {
        transLogger.error(`Error fetching user transactions: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// GET /api/transactions/income - the logged-in freelancers totals by status
const getIncome = async (req, res) => {

    try{
    transLogger.info({ userId: req.userId }, 'Freelancer accessed their income summary');

    res.json(await getFreelancerIncome(req.userId));
    } catch (error) {
        transLogger.error(`Error fetching freelancer income: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// GET /api/transactions/tax - the logged-in freelancer's estimated tax for this tax year
// The id comes from their token, so nobody can ask for another freelancer's figures
const getTaxSummary = async (req, res) => {
    try {
        transLogger.info({ userId: req.userId }, 'Freelancer accessed their tax summary');
        res.json(await getFreelancerTaxSummary(req.userId));
    } catch (error) {
        transLogger.error(`Error fetching tax summary: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// GET /api/transactions/:id - one transaction, for either party or an admin
const getTransactionById = async (req, res) => {
    try{
    // reject malformed ids before querying MongoDB
    if (!mongoose.isObjectIdOrHexString(req.params.id))
        return res.status(400).json({ message: 'Invalid transaction id' });

    // Non-admins must be on the transaction; anyone else gets the same 404 as a missing one
    const filter = { _id: req.params.id };
    if (req.userRole !== ROLES.ADMIN)
        filter.$or = [{ client: req.userId }, { freelancer: req.userId }];

    const transaction = await withDetails(Transaction.findOne(filter));
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    transLogger.info({ userId: req.userId, transactionId: transaction._id }, 'Transaction accessed');
    res.json({ transaction });
} catch (error) {
    transLogger.error(`Error fetching transaction by id: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
}
};

// GET /api/transactions - every transaction, for admins
const listTransactions = async (req, res) => {

    try{
    transLogger.info({ userId: req.userId }, 'Admin accessed all transactions');

    res.json(await findTransactionsPage({}, req.query));
    } catch (error) {
        transLogger.error(`Error listing all transactions: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    getMyTransactions,
    getIncome,
    getTaxSummary,
    getTransactionById,
    listTransactions
};

// OWASP. n.d. Logging Cheat Sheet. [online]. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html. [Accessed 7 November 2026]
// SonarSource. n.d. Logging should not be vulnerable to injection attacks (jssecurity:S5145). [online]. Available at: https://sonarcloud.io/organizations/sonarsource/rules?open=jssecurity%3AS5145&rule_key=jssecurity%3AS5145. [Accessed 7 November 2026]
