const { afterEach, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Gig = require('../../models/Gig');
const adminController = require('../../controllers/adminController');

const originalUserMethods = {
    find: User.find,
    countDocuments: User.countDocuments,
    findByIdAndUpdate: User.findByIdAndUpdate,
};
const originalGigFindOneAndUpdate = Gig.findOneAndUpdate;

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
const userId = () => new mongoose.Types.ObjectId().toString();

beforeEach(() => {
    User.find = () => ({
        select() { return this; },
        sort() { return this; },
        skip() { return this; },
        limit: async () => [],
    });
    User.countDocuments = async () => 0;
    User.findByIdAndUpdate = () => ({ select: async () => null });
    Gig.findOneAndUpdate = async () => null;
});

afterEach(() => {
    User.find = originalUserMethods.find;
    User.countDocuments = originalUserMethods.countDocuments;
    User.findByIdAndUpdate = originalUserMethods.findByIdAndUpdate;
    Gig.findOneAndUpdate = originalGigFindOneAndUpdate;
});

describe('getUsers', () => {
    it('returns users without password fields and includes pagination', async () => {
        const users = [{ _id: new mongoose.Types.ObjectId(), email: 'user@example.com' }];
        User.find = () => ({
            select() { return this; },
            sort() { return this; },
            skip() { return this; },
            limit: async () => users,
        });
        User.countDocuments = async () => 1;
        const res = response();

        await adminController.getUsers({ query: { page: '2', limit: '5' }, userId: 'admin-id' }, res);

        assert.deepEqual(res.body, {
            users,
            page: 2,
            limit: 5,
            total: 1,
            totalPages: 1,
        });
    });
});

describe('updateUserStatus', () => {
    it('rejects a malformed user ID', async () => {
        const res = response();
        await adminController.updateUserStatus({ params: { id: 'bad-id' }, body: {} }, res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Invalid user id');
    });

    it('requires a boolean active status', async () => {
        const res = response();
        await adminController.updateUserStatus({ params: { id: userId() }, body: { isActive: 'false' } }, res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'isActive must be true or false');
    });

    it('prevents an administrator from disabling their own account', async () => {
        const id = userId();
        const res = response();
        await adminController.updateUserStatus({ params: { id }, body: { isActive: false }, userId: id }, res);
        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, 'You cannot disable your own account');
    });

    it('returns not found when the target account does not exist', async () => {
        const res = response();
        await adminController.updateUserStatus({ params: { id: userId() }, body: { isActive: true }, userId: userId() }, res);
        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, 'User not found');
    });

    it('updates another user status and returns the user', async () => {
        const id = userId();
        const user = { _id: id, isActive: false };
        let update;
        User.findByIdAndUpdate = (targetId, fields, options) => {
            update = { targetId, fields, options };
            return { select: async () => user };
        };
        const res = response();
        await adminController.updateUserStatus({ params: { id }, body: { isActive: true }, userId: userId() }, res);

        assert.equal(update.targetId, id);
        assert.deepEqual(update.fields, { isActive: true });
        assert.equal(update.options.runValidators, true);
        assert.equal(res.body.user, user);
    });
});

describe('deleteGigAsAdmin', () => {
    it('rejects a malformed gig ID', async () => {
        const res = response();
        await adminController.deleteGigAsAdmin({ params: { id: 'bad-id' } }, res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Invalid gig id');
    });

    it('returns not found when the gig is missing or already inactive', async () => {
        const res = response();
        await adminController.deleteGigAsAdmin({ params: { id: userId() } }, res);
        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, 'Gig not found');
    });

    it('soft-deletes an active gig', async () => {
        const id = userId();
        const gig = { _id: id, isActive: false };
        let query;
        Gig.findOneAndUpdate = async (...args) => {
            query = args;
            return gig;
        };
        const res = response();
        await adminController.deleteGigAsAdmin({ params: { id }, userId: userId() }, res);

        assert.deepEqual(query[0], { _id: id, isActive: true });
        assert.deepEqual(query[1], { isActive: false });
        assert.equal(res.body.message, 'Gig deleted');
    });
});
