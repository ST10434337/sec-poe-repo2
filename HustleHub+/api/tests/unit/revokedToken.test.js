const { afterEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const RevokedToken = require('../../models/RevokedToken');

const originalHashToken = RevokedToken.hashToken;
const originalFindOne = RevokedToken.findOne;
const originalCreate = RevokedToken.create;

afterEach(() => {
    RevokedToken.hashToken = originalHashToken;
    RevokedToken.findOne = originalFindOne;
    RevokedToken.create = originalCreate;
});

describe('RevokedToken model methods', () => {
    it('hashes tokens instead of storing their raw value', async () => {
        const hash = await RevokedToken.hashToken('test-token');
        assert.notEqual(hash, 'test-token');
        assert.equal(await bcrypt.compare('test-token', hash), true);
    });

    it('stores the hash and expiry when revoking a token', async () => {
        const expiresAt = new Date(Date.now() + 60_000);
        let created;
        RevokedToken.hashToken = async (token) => `hash:${token}`;
        RevokedToken.create = async (record) => {
            created = record;
            return record;
        };

        await RevokedToken.revokeToken('test-token', expiresAt);
        assert.deepEqual(created, { tokenHash: 'hash:test-token', expiresAt });
    });

    it('reports whether a non-expired token hash is present', async () => {
        let query;
        RevokedToken.hashToken = async (token) => `hash:${token}`;
        RevokedToken.findOne = async (filter) => {
            query = filter;
            return { tokenHash: filter.tokenHash };
        };

        assert.equal(await RevokedToken.isRevoked('test-token'), true);
        assert.equal(query.tokenHash, 'hash:test-token');
        assert.ok(query.expiresAt.$gt instanceof Date);
    });

    it('returns false when no active revocation record is found', async () => {
        RevokedToken.hashToken = async () => 'hash:test-token';
        RevokedToken.findOne = async () => null;
        assert.equal(await RevokedToken.isRevoked('test-token'), false);
    });
});
