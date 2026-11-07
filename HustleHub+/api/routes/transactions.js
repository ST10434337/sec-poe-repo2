const express = require('express');
const router = express.Router();
const { allowRoles } = require('../middleware/auth');
const { ROLES } = require('../utils/roles');
const rateLimit = require('../middleware/rateLimit');

const {
    getMyTransactions,
    getIncome,
    getTaxSummary,
    getTransactionById,
    listTransactions
} = require('../controllers/transactionController');

// The tax summary adds up a whole tax year of payments, so it gets its own limit
const taxLimit = rateLimit.rateLimiter(60, 15, 'tax');

// Clients see payments they made; freelancers see payments they received ~> (The IIE, 2026)
router.get('/my-transactions', allowRoles(ROLES.CLIENT, ROLES.FREELANCER), getMyTransactions);

// Freelancers see their income totals: earned, pending and refunded
router.get('/income', allowRoles(ROLES.FREELANCER), getIncome);

// Freelancers see their estimated tax for this tax year
router.get('/tax', taxLimit, allowRoles(ROLES.FREELANCER), getTaxSummary);

// Admins see every transaction
router.get('/', allowRoles(ROLES.ADMIN), listTransactions);

//View one transaction if you are the client, freelancer or admin
// Keep this after the fixed routes so 'income' and 'tax' are not treated as ids
router.get('/:id', allowRoles(ROLES.CLIENT, ROLES.FREELANCER, ROLES.ADMIN), getTransactionById);

module.exports = router;
//The Independent Institute of Education (IIE). 2026. Information Systems 3D (INSY7314/w): Module manual. The Independent Institute of Education (Pty) Ltd.
