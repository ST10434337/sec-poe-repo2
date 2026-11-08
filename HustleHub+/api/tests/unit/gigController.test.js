const { afterEach, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Gig = require('../../models/Gig');
const gigController = require('../../controllers/gigController');

const originalMethods = {
    find: Gig.find,
    countDocuments: Gig.countDocuments,
    findById: Gig.findById,
    create: Gig.create,
};

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

const makeGig = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    freelancer: new mongoose.Types.ObjectId(),
    isActive: true,
    title: 'Existing gig',
    description: 'A description long enough for validation.',
    category: 'other',
    price: 100,
    set(fields) { Object.assign(this, fields); },
    save: async function () {},
    populate: async function () { return this; },
    ...overrides,
});

const query = (value) => ({
    sort() { return this; },
    skip() { return this; },
    limit() { return this; },
    populate: async () => value,
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
});

beforeEach(() => {
    Gig.find = () => query([]);
    Gig.countDocuments = async () => 0;
    Gig.findById = async () => null;
    Gig.create = async (fields) => ({ ...fields, _id: new mongoose.Types.ObjectId(), isActive: true });
});

afterEach(() => {
    Gig.find = originalMethods.find;
    Gig.countDocuments = originalMethods.countDocuments;
    Gig.findById = originalMethods.findById;
    Gig.create = originalMethods.create;
});

describe('listGigs', () => {
    it('rejects a non-text search', async () => {
        const res = response();
        await gigController.listGigs({ query: { q: { term: 'bad' } } }, res);
        assert.equal(res.statusCode, 400);
        assert.match(res.body.message, /Search must be text/);
    });

    it('rejects searches longer than the maximum', async () => {
        const res = response();
        await gigController.listGigs({ query: { q: 'a'.repeat(101) } }, res);
        assert.equal(res.statusCode, 400);
    });

    it('returns a page for a literal search and category', async () => {
        let filter;
        const gigs = [{ _id: new mongoose.Types.ObjectId() }];
        Gig.find = (value) => {
            filter = value;
            return query(gigs);
        };
        Gig.countDocuments = async () => 1;
        const res = response();

        await gigController.listGigs({ query: { q: 'a+b', category: 'other', page: '1' } }, res);

        assert.equal(filter.isActive, true);
        assert.deepEqual(filter.category, { $eq: 'other' });
        assert.equal(filter.$or[0].title.$regex.test('a+b'), true);
        assert.equal(res.body.gigs, gigs);
    });

    it('ignores a blank search and an empty category', async () => {
        let filter;
        Gig.find = (value) => {
            filter = value;
            return query([]);
        };
        const res = response();
        await gigController.listGigs({ query: { q: '  ', category: '' } }, res);
        assert.deepEqual(filter, { isActive: true });
        assert.equal(res.statusCode, 200);
    });

    it('returns a server error when listing fails', async () => {
        Gig.find = () => { throw new Error('database unavailable'); };
        const res = response();
        await gigController.listGigs({ query: {} }, res);
        assert.equal(res.statusCode, 500);
    });
});

describe('getMyGigs', () => {
    it('returns the authenticated freelancer page', async () => {
        const gigs = [makeGig()];
        Gig.find = () => query(gigs);
        Gig.countDocuments = async () => gigs.length;
        const res = response();
        await gigController.getMyGigs({ query: {}, userId: 'freelancer-id' }, res);
        assert.equal(res.body.gigs, gigs);
        assert.equal(res.body.total, 1);
    });

    it('returns a server error when the query fails', async () => {
        Gig.find = () => { throw new Error('database unavailable'); };
        const res = response();
        await gigController.getMyGigs({ query: {}, userId: 'freelancer-id' }, res);
        assert.equal(res.statusCode, 500);
    });
});

describe('getGigById', () => {
    it('rejects a malformed gig ID', async () => {
        const res = response();
        await gigController.getGigById({ params: { id: 'bad-id' } }, res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Invalid gig id');
    });

    it('returns not found for a missing or inactive gig', async () => {
        const id = new mongoose.Types.ObjectId().toString();
        const missing = response();
        await gigController.getGigById({ params: { id } }, missing);
        assert.equal(missing.statusCode, 404);

        Gig.findById = async () => makeGig({ isActive: false });
        const inactive = response();
        await gigController.getGigById({ params: { id } }, inactive);
        assert.equal(inactive.statusCode, 404);
    });

    it('populates and returns an active gig', async () => {
        const gig = makeGig();
        Gig.findById = async () => gig;
        const res = response();
        await gigController.getGigById({ params: { id: String(gig._id) } }, res);
        assert.equal(res.body.gig, gig);
    });

    it('returns a server error when retrieving a gig fails', async () => {
        Gig.findById = async () => { throw new Error('database unavailable'); };
        const res = response();
        await gigController.getGigById({ params: { id: new mongoose.Types.ObjectId().toString() } }, res);
        assert.equal(res.statusCode, 500);
    });
});

describe('createGig', () => {
    const validGig = {
        title: 'Valid gig',
        description: 'A sufficiently long description.',
        category: 'other',
        price: 100,
    };

    it('requires all editable fields', async () => {
        const res = response();
        await gigController.createGig({ body: { title: 'Valid gig' } }, res);
        assert.equal(res.statusCode, 400);
        assert.match(res.body.message, /required/);
    });

    it('rejects invalid text, category, and price values', async () => {
        const cases = [
            [{ ...validGig, title: 'x' }, /Title/],
            [{ ...validGig, description: 'short' }, /Description/],
            [{ ...validGig, category: 'unknown' }, /category/],
            [{ ...validGig, price: '100' }, /Price/],
            [{ ...validGig, price: 0 }, /Price/],
        ];
        for (const [body, message] of cases) {
            const res = response();
            await gigController.createGig({ body }, res);
            assert.equal(res.statusCode, 400);
            assert.match(res.body.message, message);
        }
    });

    it('strips HTML, ignores uneditable fields, and creates the gig', async () => {
        let fields;
        Gig.create = async (value) => {
            fields = value;
            return { ...value, _id: new mongoose.Types.ObjectId(), isActive: true };
        };
        const res = response();
        await gigController.createGig({ body: {
            ...validGig,
            title: '<b>Valid gig</b>',
            owner: 'attacker',
            isActive: false,
        }, userId: 'freelancer-id' }, res);

        assert.equal(res.statusCode, 201);
        assert.equal(fields.title, 'Valid gig');
        assert.equal(fields.freelancer, 'freelancer-id');
        assert.equal(Object.hasOwn(fields, 'owner'), false);
        assert.equal(Object.hasOwn(fields, 'isActive'), false);
    });

    it('returns a server error when creation fails', async () => {
        Gig.create = async () => { throw new Error('database unavailable'); };
        const res = response();
        await gigController.createGig({ body: validGig, userId: 'freelancer-id' }, res);
        assert.equal(res.statusCode, 500);
    });
});

describe('updateGig and deleteGig', () => {
    const id = () => new mongoose.Types.ObjectId().toString();

    it('handles invalid, missing, inactive, and foreign-owned gigs', async () => {
        const invalid = response();
        await gigController.updateGig({ params: { id: 'bad-id' }, body: {} }, invalid);
        assert.equal(invalid.statusCode, 400);

        const validId = id();
        const missing = response();
        await gigController.updateGig({ params: { id: validId }, body: {} }, missing);
        assert.equal(missing.statusCode, 404);

        Gig.findById = async () => makeGig({ isActive: false });
        const inactive = response();
        await gigController.deleteGig({ params: { id: validId }, userId: id() }, inactive);
        assert.equal(inactive.statusCode, 404);

        Gig.findById = async () => makeGig();
        const foreign = response();
        await gigController.updateGig({ params: { id: validId }, body: {}, userId: id() }, foreign);
        assert.equal(foreign.statusCode, 403);
    });

    it('requires editable fields and validates updates', async () => {
        const gig = makeGig();
        Gig.findById = async () => gig;
        const noFields = response();
        await gigController.updateGig({
            params: { id: String(gig._id) },
            body: { owner: 'ignored' },
            userId: String(gig.freelancer),
        }, noFields);
        assert.equal(noFields.statusCode, 400);
        assert.equal(noFields.body.message, 'No editable fields provided');

        const invalid = response();
        await gigController.updateGig({
            params: { id: String(gig._id) },
            body: { price: -1 },
            userId: String(gig.freelancer),
        }, invalid);
        assert.equal(invalid.statusCode, 400);
        assert.match(invalid.body.message, /Price/);
    });

    it('updates and soft-deletes an owned gig', async () => {
        const gig = makeGig();
        Gig.findById = async () => gig;
        const userId = String(gig.freelancer);
        const updated = response();
        await gigController.updateGig({
            params: { id: String(gig._id) },
            body: { price: 125 },
            userId,
        }, updated);
        assert.equal(updated.body.gig.price, 125);

        const deleted = response();
        await gigController.deleteGig({ params: { id: String(gig._id) }, userId }, deleted);
        assert.equal(deleted.body.message, 'Gig deleted');
        assert.equal(gig.isActive, false);
    });

    it('returns a server error when saving an update or deletion fails', async () => {
        const gig = makeGig({ save: async () => { throw new Error('database unavailable'); } });
        Gig.findById = async () => gig;
        const userId = String(gig.freelancer);

        const update = response();
        await gigController.updateGig({
            params: { id: String(gig._id) },
            body: { price: 125 },
            userId,
        }, update);
        assert.equal(update.statusCode, 500);

        const deletion = response();
        await gigController.deleteGig({ params: { id: String(gig._id) }, userId }, deletion);
        assert.equal(deletion.statusCode, 500);
    });
});
