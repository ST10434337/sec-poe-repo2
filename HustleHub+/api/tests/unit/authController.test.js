const { afterEach, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/User');
const RevokedToken = require('../../models/RevokedToken');
const authController = require('../../controllers/authController');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'unit-test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const originalUserMethods = {
    findOne: User.findOne,
    create: User.create,
    findById: User.findById,
};
const originalRevokeToken = RevokedToken.revokeToken;
const originalNodeEnv = process.env.NODE_ENV;

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

const queryResult = (value) => ({
    select: async () => value,
});

const validRegistration = {
    email: 'new-user@example.com',
    name: 'New User',
    password: 'Pass123!',
};

const request = (body = {}, extra = {}) => ({ body, ...extra });

beforeEach(() => {
    User.findOne = async () => null;
    User.create = async (fields) => ({
        ...fields,
        _id: new mongoose.Types.ObjectId(),
    });
    User.findById = async () => null;
    RevokedToken.revokeToken = async () => ({});
    process.env.NODE_ENV = 'test';
});

afterEach(() => {
    User.findOne = originalUserMethods.findOne;
    User.create = originalUserMethods.create;
    User.findById = originalUserMethods.findById;
    RevokedToken.revokeToken = originalRevokeToken;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
});

describe('registerUser', () => {
    it('requires email, password, and name', async () => {
        const res = response();
        await authController.registerUser(request({ email: 'a@example.com' }), res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Email, password and name are required');
    });

    it('rejects roles not available for public registration', async () => {
        const res = response();
        await authController.registerUser(request({ ...validRegistration, role: 'admin' }), res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Role must be client or freelancer');
    });

    it('rejects a name that is empty after tags are removed', async () => {
        const res = response();
        await authController.registerUser(request({ ...validRegistration, name: '<b></b>' }), res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Name must be 1 to 100 characters of text');
    });

    it('rejects a name longer than 100 characters', async () => {
        const res = response();
        await authController.registerUser(request({ ...validRegistration, name: 'a'.repeat(101) }), res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Name must be 1 to 100 characters of text');
    });

    it('rejects an invalid email address', async () => {
        const res = response();
        await authController.registerUser(request({ ...validRegistration, email: 'not-an-email' }), res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Invalid email format');
    });

    it('rejects a weak password', async () => {
        const res = response();
        await authController.registerUser(request({ ...validRegistration, password: 'weak' }), res);
        assert.equal(res.statusCode, 400);
        assert.match(res.body.message, /Password must be at least 8 characters/);
    });

    it('rejects an email that is already registered', async () => {
        User.findOne = async () => ({ _id: new mongoose.Types.ObjectId() });
        const res = response();
        await authController.registerUser(request(validRegistration), res);
        assert.equal(res.statusCode, 409);
        assert.equal(res.body.message, 'Email already in use');
    });

    it('normalizes and strips the registration name and email', async () => {
        let created;
        User.create = async (fields) => {
            created = fields;
            return { ...fields, _id: new mongoose.Types.ObjectId() };
        };
        const res = response();
        await authController.registerUser(request({
            ...validRegistration,
            email: ' NEW-USER@EXAMPLE.COM ',
            name: '  <b>New User</b>  ',
        }), res);

        assert.equal(res.statusCode, 201);
        assert.equal(created.email, 'new-user@example.com');
        assert.equal(created.name, 'New User');
        assert.equal(created.role, 'client');
        assert.ok(jwt.verify(res.body.token, process.env.JWT_SECRET));
        assert.equal(Object.hasOwn(res.body.user, 'password'), false);
    });

    it('returns a conflict when the database reports a duplicate email', async () => {
        User.create = async () => { throw { code: 11000 }; };
        const res = response();
        await authController.registerUser(request(validRegistration), res);
        assert.equal(res.statusCode, 409);
        assert.equal(res.body.message, 'Email already in use');
    });

    it('returns a validation error for a model validation failure', async () => {
        User.create = async () => { throw new mongoose.Error.ValidationError(); };
        const res = response();
        await authController.registerUser(request(validRegistration), res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Validation error');
    });

    it('returns a server error for an unexpected registration failure', async () => {
        User.findOne = async () => { throw new Error('database unavailable'); };
        const res = response();
        await authController.registerUser(request(validRegistration), res);
        assert.equal(res.statusCode, 500);
        assert.equal(res.body.message, 'Server error');
    });

    it('logs unexpected registration failures in development', async () => {
        process.env.NODE_ENV = 'Dev';
        User.findOne = async () => { throw new Error('database unavailable'); };
        const originalError = console.error;
        console.error = () => {};
        const res = response();
        try {
            await authController.registerUser(request(validRegistration), res);
        } finally {
            console.error = originalError;
        }
        assert.equal(res.statusCode, 500);
        assert.equal(res.body.message, 'Server error');
    });
});

describe('loginUser', () => {
    it('requires an email and password', async () => {
        const res = response();
        await authController.loginUser(request({ email: 'user@example.com' }), res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Email and password are required');
    });

    it('rejects an account that does not exist', async () => {
        const res = response();
        await authController.loginUser(request({ email: 'missing@example.com', password: 'Pass123!' }), res);
        assert.equal(res.statusCode, 401);
        assert.equal(res.body.message, 'Invalid credentials');
    });

    it('rejects a temporarily locked account', async () => {
        User.findOne = async () => ({ lockUntil: new Date(Date.now() + 60_000) });
        const res = response();
        await authController.loginUser(request({ email: 'locked@example.com', password: 'Pass123!' }), res);
        assert.equal(res.statusCode, 403);
        assert.match(res.body.message, /temporarily locked/);
    });

    it('increments failed attempts and locks the account on the fifth failure', async () => {
        const user = {
            loginAttempts: 4,
            lockUntil: null,
            comparePassword: async () => false,
            save: async () => {},
        };
        User.findOne = async () => user;
        const res = response();
        await authController.loginUser(request({ email: 'user@example.com', password: 'wrong' }), res);

        assert.equal(res.statusCode, 401);
        assert.equal(user.loginAttempts, 5);
        assert.ok(user.lockUntil > Date.now());
    });

    it('increments failed attempts without locking before the fifth failure', async () => {
        const user = {
            loginAttempts: 1,
            lockUntil: null,
            comparePassword: async () => false,
            save: async () => {},
        };
        User.findOne = async () => user;
        const res = response();
        await authController.loginUser(request({ email: 'user@example.com', password: 'wrong' }), res);

        assert.equal(res.statusCode, 401);
        assert.equal(user.loginAttempts, 2);
        assert.equal(user.lockUntil, null);
    });

    it('rejects a disabled account after verifying its password', async () => {
        User.findOne = async () => ({
            isActive: false,
            lockUntil: null,
            comparePassword: async () => true,
        });
        const res = response();
        await authController.loginUser(request({ email: 'disabled@example.com', password: 'Pass123!' }), res);
        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, 'Account is disabled');
    });

    it('resets failed attempts and returns a token on successful login', async () => {
        const user = {
            _id: new mongoose.Types.ObjectId(),
            email: 'user@example.com',
            name: 'User',
            role: 'client',
            isActive: true,
            lockUntil: null,
            loginAttempts: 3,
            comparePassword: async () => true,
            save: async () => {},
        };
        User.findOne = async () => user;
        const res = response();
        await authController.loginUser(request({ email: 'USER@example.com', password: 'Pass123!' }), res);

        assert.equal(res.statusCode, 200);
        assert.equal(user.loginAttempts, 0);
        assert.equal(jwt.verify(res.body.token, process.env.JWT_SECRET).userId, String(user._id));
    });

    it('returns a server error if login encounters an unexpected failure', async () => {
        User.findOne = async () => { throw new Error('database unavailable'); };
        const res = response();
        const originalError = console.error;
        console.error = () => {};
        try {
            await authController.loginUser(request({ email: 'user@example.com', password: 'Pass123!' }), res);
        } finally {
            console.error = originalError;
        }
        assert.equal(res.statusCode, 500);
        assert.equal(res.body.message, 'Server error');
    });
});

describe('getCurrentUser', () => {
    it('returns the profile without a password', async () => {
        const user = {
            _id: new mongoose.Types.ObjectId(),
            name: 'User',
            email: 'user@example.com',
            role: 'client',
        };
        User.findById = () => queryResult(user);
        const res = response();
        await authController.getCurrentUser(request({}, { userId: String(user._id) }), res);

        assert.deepEqual(res.body, { name: user.name, email: user.email, role: user.role });
    });

    it('returns not found when the account no longer exists', async () => {
        User.findById = () => queryResult(null);
        const res = response();
        await authController.getCurrentUser(request({}, { userId: new mongoose.Types.ObjectId().toString() }), res);
        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, 'User not found');
    });

    it('returns a server error when the profile lookup fails', async () => {
        User.findById = () => ({ select: async () => { throw new Error('database unavailable'); } });
        const res = response();
        const originalError = console.error;
        console.error = () => {};
        try {
            await authController.getCurrentUser(request({}, { userId: new mongoose.Types.ObjectId().toString() }), res);
        } finally {
            console.error = originalError;
        }
        assert.equal(res.statusCode, 500);
        assert.equal(res.body.message, 'Server error');
    });
});

describe('becomeFreelancer', () => {
    it('returns not found when the account does not exist', async () => {
        const res = response();
        await authController.becomeFreelancer(request({}, { userId: new mongoose.Types.ObjectId().toString() }), res);
        assert.equal(res.statusCode, 404);
    });

    it('issues a refreshed token when the user is already a freelancer', async () => {
        const user = {
            _id: new mongoose.Types.ObjectId(),
            email: 'freelancer@example.com',
            name: 'Freelancer',
            role: 'freelancer',
        };
        User.findById = async () => user;
        const res = response();
        await authController.becomeFreelancer(request({}, { userId: String(user._id) }), res);
        assert.equal(res.body.user.role, 'freelancer');
        assert.equal(jwt.verify(res.body.token, process.env.JWT_SECRET).userId, String(user._id));
    });

    it('rejects an account that is neither a client nor a freelancer', async () => {
        User.findById = async () => ({ role: 'admin' });
        const res = response();
        await authController.becomeFreelancer(request({}, { userId: new mongoose.Types.ObjectId().toString() }), res);
        assert.equal(res.statusCode, 409);
        assert.match(res.body.message, /Only client accounts/);
    });

    it('returns a server error when upgrading the account fails', async () => {
        User.findById = async () => { throw new Error('database unavailable'); };
        const res = response();
        const originalError = console.error;
        console.error = () => {};
        try {
            await authController.becomeFreelancer(request({}, { userId: new mongoose.Types.ObjectId().toString() }), res);
        } finally {
            console.error = originalError;
        }
        assert.equal(res.statusCode, 500);
    });
});

describe('updateUserRole', () => {
    it('rejects a malformed user ID', async () => {
        const res = response();
        await authController.updateUserRole(request({ role: 'admin' }, { params: { userId: 'not-an-id' } }), res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Invalid user ID');
    });

    it('rejects an unsupported role', async () => {
        const res = response();
        await authController.updateUserRole(request({ role: 'client' }, {
            params: { userId: new mongoose.Types.ObjectId().toString() },
        }), res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Role must be freelancer or admin');
    });

    it('returns not found when the target account does not exist', async () => {
        const res = response();
        await authController.updateUserRole(request({ role: 'admin' }, {
            params: { userId: new mongoose.Types.ObjectId().toString() },
        }), res);
        assert.equal(res.statusCode, 404);
    });

    it('updates the target role', async () => {
        const user = {
            _id: new mongoose.Types.ObjectId(),
            email: 'user@example.com',
            name: 'User',
            role: 'client',
            save: async function () {},
        };
        User.findById = async () => user;
        const res = response();
        await authController.updateUserRole(request({ role: 'freelancer' }, {
            params: { userId: String(user._id) },
        }), res);
        assert.equal(res.body.user.role, 'freelancer');
    });

    it('returns a server error when saving the role fails', async () => {
        User.findById = async () => ({
            role: 'client',
            save: async () => { throw new Error('database unavailable'); },
        });
        const res = response();
        const originalError = console.error;
        console.error = () => {};
        try {
            await authController.updateUserRole(request({ role: 'admin' }, {
                params: { userId: new mongoose.Types.ObjectId().toString() },
            }), res);
        } finally {
            console.error = originalError;
        }
        assert.equal(res.statusCode, 500);
    });
});

describe('logoutUser', () => {
    it('rejects a token without an expiry', async () => {
        const res = response();
        await authController.logoutUser(request({}, { token: jwt.sign({ userId: 'user' }, process.env.JWT_SECRET) }), res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Invalid token expiry information.');
    });

    it('revokes an expiring token until its expiry time', async () => {
        const token = jwt.sign({ userId: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        let revokedToken;
        let expiry;
        RevokedToken.revokeToken = async (value, date) => {
            revokedToken = value;
            expiry = date;
        };
        const res = response();
        await authController.logoutUser(request({}, { token }), res);

        assert.equal(res.statusCode, 200);
        assert.equal(revokedToken, token);
        assert.equal(expiry.getTime(), jwt.decode(token).exp * 1000);
    });

    it('treats a duplicate revocation as a successful logout', async () => {
        RevokedToken.revokeToken = async () => { throw { code: 11000 }; };
        const token = jwt.sign({ userId: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const res = response();
        await authController.logoutUser(request({}, { token }), res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.message, 'Token already revoked.');
    });

    it('returns an error when revocation fails unexpectedly', async () => {
        RevokedToken.revokeToken = async () => { throw new Error('database unavailable'); };
        const token = jwt.sign({ userId: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const res = response();
        await authController.logoutUser(request({}, { token }), res);
        assert.equal(res.statusCode, 500);
        assert.equal(res.body.message, 'Unable to process logout.');
    });
});
