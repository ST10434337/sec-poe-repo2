const mongoose = require('mongoose'); //(The IIE, 2026)
const { BOOKING_STATUS } = require('../utils/statuses');

// Define the Booking schema ~> (The IIE, 2026)
const bookingSchema = new mongoose.Schema({
  // The client who booked; always set from the logged-in user
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Copied from the gig record, never taken from the request body
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  gig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true
  },

  // Price agreed at booking time (whole rand), so later gig price edits do not change it
  price: {
    type: Number,
    required: true,
    min: 1,
    max: 1000000,
    validate: { validator: Number.isInteger, message: 'Price must be a whole number of rand' }
  },

  status: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.CONFIRMED
  },

}, { timestamps: true });

// The client and freelancer booking lists filter on their user and sort newest first
bookingSchema.index({ client: 1, createdAt: -1 });
bookingSchema.index({ freelancer: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
//The Independent Institute of Education (IIE). 2026. Information Systems 3D (INSY7314/w): Module manual. The Independent Institute of Education (Pty) Ltd.
