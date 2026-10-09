const mongoose = require('mongoose'); //(The IIE, 2026)
const { GIG_CATEGORIES } = require('../utils/gigCategories');

// Define the Gig schema ~> (The IIE, 2026)
const gigSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minLength: 3,
    maxLength: 100
  },

  description: {
    type: String,
    required: true,
    trim: true,
    minLength: 10,
    maxLength: 2000
  },

  category: {
    type: String,
    required: true,
    enum: GIG_CATEGORIES
  },

  // Price in whole rand (ZAR), so income totals never have rounding errors
  price: {
    type: Number,
    required: true,
    min: 1,
    max: 1000000,
    validate: { validator: Number.isInteger, message: 'Price must be a whole number of rand' }
  },

  // Owner of the gig; always set from the logged-in user, never from the request body
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // false = soft deleted, so bookings and transactions keep a valid gig reference
  isActive: {
    type: Boolean,
    default: true
  },

}, { timestamps: true });

// Browsing filters on isActive and category, newest first
gigSchema.index({ isActive: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('Gig', gigSchema);
//The Independent Institute of Education (IIE). 2026. Information Systems 3D (INSY7314/w): Module manual. The Independent Institute of Education (Pty) Ltd.
