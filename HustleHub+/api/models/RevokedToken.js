const mongoose = require('mongoose');
const crypto = require('crypto');

const revokedTokenSchema = new mongoose.Schema({
    tokenHash: {
        type: String,
        required: true,
        unique: true
    },

    expiresAt: {
        type: Date,
        required: true,
        expires: 0
    }
});

// Hash a JWT token
revokedTokenSchema.statics.hashToken = function(token) {
    return crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
};

// Revoke a JWT token
revokedTokenSchema.statics.revokeToken = async function(token, expiresAt) {
    const tokenHash = this.hashToken(token);

    return await this.create({
        tokenHash,
        expiresAt
    });
};

// Check whether a JWT token has been revoked
revokedTokenSchema.statics.isRevoked = async function(token) {
    const tokenHash = this.hashToken(token);

    const revokedToken = await this.findOne({
        tokenHash,
        expiresAt: { $gt: new Date() }
    });

    return !!revokedToken;
};

module.exports = mongoose.model(
    'RevokedToken',
    revokedTokenSchema
);