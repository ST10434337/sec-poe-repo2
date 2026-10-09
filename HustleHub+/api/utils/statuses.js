// Booking lifecycle: confirmed -> in_progress -> completed, or confirmed -> cancelled
const BOOKING_STATUS = Object.freeze({
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
});

// Transaction lifecycle: pending -> completed (paid to the freelancer), or pending -> refunded
const TRANSACTION_STATUS = Object.freeze({
    PENDING: 'pending',
    COMPLETED: 'completed',
    REFUNDED: 'refunded',
});

module.exports = { BOOKING_STATUS, TRANSACTION_STATUS };
