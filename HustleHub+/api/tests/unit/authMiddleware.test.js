const { afterEach, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/User');
const RevokedToken = require('../../models/RevokedToken');
const { requireAuth, allowRoles } = require('../../middleware/auth');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'unit-test-secret';

const originalFindById = User.findById;
const originalIsRevoked = RevokedToken.isRevoked;

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

const requestWithToken = (token) => ({
    headers: token ? { authorization: `Bearer ${token}` } : {},
});

const tokenFor = (payload = { userId: new mongoose.Types.ObjectId().toString(), role: 'client' }) =>
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

beforeEach(() => {
    User.findById = () => ({ select: async () => ({ role: 'client', isActive: true }) });
    RevokedToken.isRevoked = async () => false;
});

afterEach(() => {
    User.findById = originalFindById;
    RevokedToken.isRevoked = originalIsRevoked;
});

describe('requireAuth', () => {
    it('sets the verified user identity before continuing', async () => {
        const token = tokenFor();
        const req = requestWithToken(token);
        const res = response();
        let nextCalled = false;

        await requireAuth(req, res, () => {
            nextCalled = true;
            assert.equal(req.userId, jwt.verify(token, process.env.JWT_SECRET).userId);
            assert.equal(req.userRole, 'client');
        });

        assert.equal(nextCalled, true);
        assert.equal(res.statusCode, 200);
    });

    it('rejects a request without a bearer token', async () => {
        const res = response();
        let nextCalled = false;
        await requireAuth(requestWithToken(), res, () => { nextCalled = true; });
        assert.equal(res.statusCode, 401);
        assert.equal(res.body.message, 'No Token Provided');
        assert.equal(nextCalled, false);
    });

    it('rejects a bearer header with no token', async () => {
        const res = response();
        await requireAuth({ headers: { authorization: 'Bearer ' } }, res, () => assert.fail('next should not run'));
        assert.equal(res.statusCode, 401);
        assert.equal(res.body.message, 'Invalid token provided');
    });

    it('rejects an invalid token', async () => {
        const res = response();
        await requireAuth(requestWithToken('not-a-jwt'), res, () => assert.fail('next should not run'));
        assert.equal(res.statusCode, 401);
        assert.equal(res.body.message, 'Invalid or expired token');
    });

    it('rejects a token without user identity and role claims', async () => {
        const res = response();
        await requireAuth(requestWithToken(tokenFor({ subject: 'user' })), res, () => assert.fail('next should not run'));
        assert.equal(res.statusCode, 401);
        assert.equal(res.body.message, 'Invalid token payload');
    });

    it('rejects a revoked token', async () => {
        RevokedToken.isRevoked = async () => true;
        const res = response();
        await requireAuth(requestWithToken(tokenFor()), res, () => assert.fail('next should not run'));
        assert.equal(res.statusCode, 401);
        assert.equal(res.body.message, 'Session Expired. Please log in again.');
    });

    it('rejects a user who no longer exists', async () => {
        User.findById = () => ({ select: async () => null });
        const res = response();
        await requireAuth(requestWithToken(tokenFor()), res, () => assert.fail('next should not run'));
        assert.equal(res.statusCode, 401);
        assert.equal(res.body.message, 'User not found');
    });

    it('rejects a disabled user', async () => {
        User.findById = () => ({ select: async () => ({ role: 'client', isActive: false }) });
        const res = response();
        await requireAuth(requestWithToken(tokenFor()), res, () => assert.fail('next should not run'));
        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, 'Account is disabled');
    });

    it('passes database lookup errors to Express', async () => {
        const error = new Error('database unavailable');
        User.findById = () => ({ select: async () => { throw error; } });
        let nextError;
        await requireAuth(requestWithToken(tokenFor()), response(), (err) => { nextError = err; });
        assert.equal(nextError, error);
    });
});

describe('allowRoles', () => {
    it('rejects an authenticated user outside the allowed roles', async () => {
        const res = response();
        await allowRoles('admin')(requestWithToken(tokenFor()), res, () => assert.fail('next should not run'));
        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, 'Access Denied');
    });

    it('continues for an active user with an allowed role', async () => {
        User.findById = () => ({ select: async () => ({ role: 'freelancer', isActive: true }) });
        const req = requestWithToken(tokenFor({ userId: new mongoose.Types.ObjectId().toString(), role: 'client' }));
        const res = response();
        let nextCalled = false;

        await allowRoles('freelancer')(req, res, () => { nextCalled = true; });
        assert.equal(nextCalled, true);
        assert.equal(req.userRole, 'freelancer');
    });

    it('passes database lookup errors to Express', async () => {
        const error = new Error('database unavailable');
        User.findById = () => ({ select: async () => { throw error; } });
        let nextError;

        await allowRoles('admin')(requestWithToken(tokenFor()), response(), (err) => { nextError = err; });
        assert.equal(nextError, error);
    });
});
