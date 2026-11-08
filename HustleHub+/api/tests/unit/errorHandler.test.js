const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const errorHandler = require('../../middleware/errorHandler');

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

describe('errorHandler', () => {
    it('returns a safe error for invalid JSON', () => {
        const res = response();
        errorHandler({ message: 'invalid JSON', type: 'entity.parse.failed' }, {}, res, () => {});
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Invalid JSON body');
    });

    it('returns a payload-too-large response', () => {
        const res = response();
        errorHandler({ message: 'large body', type: 'entity.too.large' }, {}, res, () => {});
        assert.equal(res.statusCode, 413);
        assert.equal(res.body.message, 'Request body too large');
    });

    it('returns a validation response for Mongoose validation errors', () => {
        const res = response();
        errorHandler(new mongoose.Error.ValidationError(), {}, res, () => {});
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Validation error');
    });

    it('returns a safe response for Mongoose cast errors', () => {
        const res = response();
        errorHandler(new mongoose.Error.CastError('ObjectId', 'invalid', '_id'), {}, res, () => {});
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Invalid id');
    });

    it('hides unexpected error details from the client', () => {
        const res = response();
        errorHandler(new Error('database password should not be exposed'), {}, res, () => {});
        assert.equal(res.statusCode, 500);
        assert.equal(res.body.message, 'Server error');
        assert.equal(JSON.stringify(res.body).includes('database password'), false);
    });
});
