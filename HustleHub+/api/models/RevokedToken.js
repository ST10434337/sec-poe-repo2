const mongoose = require('mongoose');
const bcrypt = require('bcrypt');//(The IIE, 2026)

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
revokedTokenSchema.statics.hashToken = async function(token) {
    const hashedToken = await bcrypt.hash(token, 12);
    return hashedToken;
};

// Revoke a JWT token
revokedTokenSchema.statics.revokeToken = async function(token, expiresAt) {
    const tokenHash = await this.hashToken(token);

    return await this.create({
        tokenHash,
        expiresAt
    });
};

// Check whether a JWT token has been revoked
revokedTokenSchema.statics.isRevoked = async function(token) {
    const tokenHash = await this.hashToken(token);

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