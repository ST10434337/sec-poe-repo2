const mongoose = require('mongoose'); //(The IIE, 2026)
const { TRANSACTION_STATUS } = require('../utils/statuses');

// Define the Transaction schema: the simulated payment created with each booking
const transactionSchema = new mongoose.Schema({
  // Exactly one transaction per booking, enforced by the unique index
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },

  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Copied from the booking price (whole rand)
  amount: {
    type: Number,
    required: true,
    min: 1,
    max: 1000000,
    validate: { validator: Number.isInteger, message: 'Amount must be a whole number of rand' }
  },

  currency: {
    type: String,
    enum: ['ZAR'],
    default: 'ZAR'
  },

  status: {
    type: String,
    enum: Object.values(TRANSACTION_STATUS),
    default: TRANSACTION_STATUS.PENDING
  },

  // No real payment provider is used in this project
  paymentMethod: {
    type: String,
    enum: ['simulated'],
    default: 'simulated'
  },

  // Simulated payment confirmation shown to the user, e.g. TXN-<uuid>
  reference: {
    type: String,
    required: true,
    unique: true
  },

}, { timestamps: true });

// Each party's transaction list filters on their user and sorts newest first
transactionSchema.index({ client: 1, createdAt: -1 });
transactionSchema.index({ freelancer: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
//The Independent Institute of Education (IIE). 2026. Information Systems 3D (INSY7314/w): Module manual. The Independent Institute of Education (Pty) Ltd.
