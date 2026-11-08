const { afterEach, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Transaction = require('../../models/Transaction');
const incomeService = require('../../services/incomeService');
const originalIncome = incomeService.getFreelancerIncome;
const originalTaxSummary = incomeService.getFreelancerTaxSummary;
let incomeResult = async () => ({ earned: 100 });
let taxResult = async () => ({ earned: 100, pending: 25 });
incomeService.getFreelancerIncome = (...args) => incomeResult(...args);
incomeService.getFreelancerTaxSummary = (...args) => taxResult(...args);
const transactionController = require('../../controllers/transactionController');

const originalFind = Transaction.find;
const originalCountDocuments = Transaction.countDocuments;
const originalFindOne = Transaction.findOne;

const response = () => ({
    statusCode: 200,
    body: undefined,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    },
});

const query = (value) => ({
    sort() { return this; },
    skip() { return this; },
    limit() { return this; },
    populate() { return this; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
    select() { return Promise.resolve(value); },
});

beforeEach(() => {
    Transaction.find = () => query([]);
    Transaction.countDocuments = async () => 0;
    Transaction.findOne = () => query(null);
    incomeResult = async () => ({ earned: 100 });
    taxResult = async () => ({ earned: 100, pending: 25 });
});

afterEach(() => {
    Transaction.find = originalFind;
    Transaction.countDocuments = originalCountDocuments;
    Transaction.findOne = originalFindOne;
});

describe('getMyTransactions', () => {
    it('filters client transactions and returns pagination data', async () => {
        const transactions = [{ _id: new mongoose.Types.ObjectId() }];
        let filter;
        Transaction.find = (value) => {
            filter = value;
            return query(transactions);
        };
        Transaction.countDocuments = async () => 1;
        const res = response();
        await transactionController.getMyTransactions({
            userId: 'client-id',
            userRole: 'client',
            query: { page: '1', limit: '10' },
        }, res);

        assert.deepEqual(filter, { client: 'client-id' });
        assert.equal(res.body.transactions, transactions);
        assert.equal(res.body.total, 1);
    });

    it('filters freelancer transactions', async () => {
        let filter;
        Transaction.find = (value) => {
            filter = value;
            return query([]);
        };
        const res = response();
        await transactionController.getMyTransactions({
            userId: 'freelancer-id',
            userRole: 'freelancer',
            query: {},
        }, res);
        assert.deepEqual(filter, { freelancer: 'freelancer-id' });
    });

    it('returns a server error when transaction listing fails', async () => {
        Transaction.find = () => { throw new Error('database unavailable'); };
        const res = response();
        await transactionController.getMyTransactions({ userId: 'client-id', userRole: 'client', query: {} }, res);
        assert.equal(res.statusCode, 500);
        assert.equal(res.body.message, 'Internal server error');
    });
});

describe('getIncome and getTaxSummary', () => {
    it('returns the income summary', async () => {
        const res = response();
        await transactionController.getIncome({ userId: 'freelancer-id' }, res);
        assert.deepEqual(res.body, { earned: 100 });
    });

    it('returns an error when the income summary fails', async () => {
        incomeResult = async () => { throw new Error('database unavailable'); };
        const res = response();
        await transactionController.getIncome({ userId: 'freelancer-id' }, res);
        assert.equal(res.statusCode, 500);
    });

    it('returns the tax summary', async () => {
        const res = response();
        await transactionController.getTaxSummary({ userId: 'freelancer-id' }, res);
        assert.deepEqual(res.body, { earned: 100, pending: 25 });
    });

    it('returns an error when tax-summary calculation fails', async () => {
        taxResult = async () => { throw new Error('calculation failed'); };
        const res = response();
        await transactionController.getTaxSummary({ userId: 'freelancer-id' }, res);
        assert.equal(res.statusCode, 500);
    });
});

describe('getTransactionById', () => {
    it('rejects a malformed transaction ID', async () => {
        const res = response();
        await transactionController.getTransactionById({ params: { id: 'bad-id' } }, res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Invalid transaction id');
    });

    it('returns not found when the transaction is absent', async () => {
        const res = response();
        await transactionController.getTransactionById({
            params: { id: new mongoose.Types.ObjectId().toString() },
            userId: 'client-id',
            userRole: 'client',
        }, res);
        assert.equal(res.statusCode, 404);
    });

    it('filters non-admin access to a transaction party', async () => {
        let filter;
        const transaction = { _id: new mongoose.Types.ObjectId() };
        Transaction.findOne = (value) => {
            filter = value;
            return query(transaction);
        };
        const res = response();
        await transactionController.getTransactionById({
            params: { id: String(transaction._id) },
            userId: 'client-id',
            userRole: 'client',
        }, res);

        assert.deepEqual(filter.$or, [{ client: 'client-id' }, { freelancer: 'client-id' }]);
        assert.equal(res.body.transaction, transaction);
    });

    it('allows admins to access any transaction by ID', async () => {
        let filter;
        const transaction = { _id: new mongoose.Types.ObjectId() };
        Transaction.findOne = (value) => {
            filter = value;
            return query(transaction);
        };
        const res = response();
        await transactionController.getTransactionById({
            params: { id: String(transaction._id) },
            userId: 'admin-id',
            userRole: 'admin',
        }, res);
        assert.deepEqual(filter, { _id: String(transaction._id) });
    });

    it('returns a server error when transaction lookup fails', async () => {
        Transaction.findOne = () => { throw new Error('database unavailable'); };
        const res = response();
        await transactionController.getTransactionById({
            params: { id: new mongoose.Types.ObjectId().toString() },
            userId: 'client-id',
            userRole: 'client',
        }, res);
        assert.equal(res.statusCode, 500);
    });
});

describe('listTransactions', () => {
    it('returns the paginated admin transaction list', async () => {
        const transactions = [{ _id: new mongoose.Types.ObjectId() }];
        Transaction.find = () => query(transactions);
        Transaction.countDocuments = async () => 1;
        const res = response();
        await transactionController.listTransactions({ query: { page: '1', limit: '10' }, userId: 'admin-id' }, res);
        assert.equal(res.body.transactions, transactions);
        assert.equal(res.body.total, 1);
    });

    it('returns a server error when listing transactions fails', async () => {
        Transaction.find = () => { throw new Error('database unavailable'); };
        const res = response();
        await transactionController.listTransactions({ query: {}, userId: 'admin-id' }, res);
        assert.equal(res.statusCode, 500);
    });
});

afterEach(() => {
    incomeService.getFreelancerIncome = originalIncome;
    incomeService.getFreelancerTaxSummary = originalTaxSummary;
});
