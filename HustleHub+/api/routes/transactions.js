const express = require('express');
const router = express.Router();
const { allowRoles } = require('../middleware/auth');
const { ROLES } = require('../utils/roles');

const {
    getMyTransactions,
    getIncome,
    getTransactionById,
    listTransactions
} = require('../controllers/transactionController');

// Clients see payments they made; freelancers see payments they received ~> (The IIE, 2026)
router.get('/my-transactions', allowRoles(ROLES.CLIENT, ROLES.FREELANCER), getMyTransactions);

// Freelancers see their income totals: earned, pending and refunded
router.get('/income', allowRoles(ROLES.FREELANCER), getIncome);

// Admins see every transaction
router.get('/', allowRoles(ROLES.ADMIN), listTransactions);

//View one transaction if you are the client, freelancer or admin
// Keep this after the fixed routes so 'income' is not treated as an id
router.get('/:id', allowRoles(ROLES.CLIENT, ROLES.FREELANCER, ROLES.ADMIN), getTransactionById);

module.exports = router;
//The Independent Institute of Education (IIE). 2026. Information Systems 3D (INSY7314/w): Module manual. The Independent Institute of Education (Pty) Ltd.
