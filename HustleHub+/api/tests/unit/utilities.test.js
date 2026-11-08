const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parsePagination, pageInfo } = require('../../utils/pagination');
const { escapeRegex, stripTags } = require('../../utils/sanitize');
const sanitizeBody = require('../../middleware/sanitizeBody');

describe('pagination utilities', () => {
    it('uses defaults when pagination parameters are missing', () => {
        assert.deepEqual(parsePagination({}), { page: 1, limit: 10, skip: 0 });
    });

    it('parses valid page and limit parameters and computes skip', () => {
        assert.deepEqual(parsePagination({ page: '4', limit: '20' }), {
            page: 4,
            limit: 20,
            skip: 60,
        });
    });

    it('uses defaults for malformed, non-positive, or non-string values', () => {
        for (const value of ['', '0', '-1', '1.5', 'many', 5, null]) {
            assert.deepEqual(parsePagination({ page: value, limit: value }), {
                page: 1,
                limit: 10,
                skip: 0,
            });
        }
    });

    it('caps page and limit values', () => {
        assert.deepEqual(parsePagination({ page: '10001', limit: '500' }), {
            page: 10000,
            limit: 50,
            skip: 499950,
        });
    });

    it('returns pagination metadata with a zero-page result when empty', () => {
        assert.deepEqual(pageInfo(1, 10, 0), {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
        });
    });

    it('rounds total pages up for a partial final page', () => {
        assert.equal(pageInfo(1, 10, 21).totalPages, 3);
    });
});

describe('text sanitization utilities', () => {
    it('escapes regex metacharacters for literal searches', () => {
        assert.equal(escapeRegex('a+b? (test)'), 'a\\+b\\? \\(test\\)');
        assert.equal(escapeRegex('ordinary text'), 'ordinary text');
    });

    it('strips tags but preserves the text around them', () => {
        assert.equal(stripTags('<b>Hello</b> <i>world</i>'), 'Hello world');
        assert.equal(stripTags('plain text'), 'plain text');
    });

    it('preserves a less-than sign when no closing angle bracket follows', () => {
        assert.equal(stripTags('1 < 2'), '1 < 2');
    });

    it('returns non-string values unchanged', () => {
        assert.equal(stripTags(null), null);
        assert.equal(stripTags(42), 42);
    });
});

describe('sanitizeBody middleware', () => {
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

    it('continues for safe nested objects and arrays', () => {
        const res = response();
        let nextCalled = false;
        sanitizeBody({ body: { items: [{ name: 'safe' }], count: 2 } }, res, () => {
            nextCalled = true;
        });
        assert.equal(nextCalled, true);
        assert.equal(res.statusCode, 200);
    });

    it('rejects keys beginning with a dollar sign or containing a dot', () => {
        for (const body of [{ $where: 'bad' }, { user: { 'profile.name': 'bad' } }]) {
            const res = response();
            let nextCalled = false;
            sanitizeBody({ body }, res, () => { nextCalled = true; });
            assert.equal(res.statusCode, 400);
            assert.equal(res.body.message, 'Invalid request body');
            assert.equal(nextCalled, false);
        }
    });

    it('rejects objects nested beyond the maximum depth', () => {
        let body = {};
        for (let depth = 0; depth < 11; depth++) body = { child: body };
        const res = response();
        sanitizeBody({ body }, res, () => assert.fail('next should not run'));
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Invalid request body');
    });
});
