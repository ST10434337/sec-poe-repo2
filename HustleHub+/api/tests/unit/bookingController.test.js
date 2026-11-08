const { afterEach, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Gig = require('../../models/Gig');
const Booking = require('../../models/Booking');
const Transaction = require('../../models/Transaction');
const bookingService = require('../../services/bookingService');
let createBookingResult = async () => ({ booking: { _id: 'booking' }, transaction: { _id: 'transaction' } });
let changeBookingResult = async () => ({ booking: { _id: 'booking' }, transaction: { _id: 'transaction' } });
bookingService.createBookingWithTransaction = (...args) => createBookingResult(...args);
bookingService.changeBookingStatus = (...args) => changeBookingResult(...args);
const bookingController = require('../../controllers/bookingController');

const originalGigFindById = Gig.findById;
const originalBookingFind = Booking.find;
const originalBookingCount = Booking.countDocuments;
const originalBookingFindOne = Booking.findOne;
const originalTransactionFindOne = Transaction.findOne;

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

const query = (value) => ({
    sort() { return this; },
    skip() { return this; },
    limit() { return this; },
    populate() { return this; },
    select() { return Promise.resolve(value); },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
});

const makeBooking = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    client: new mongoose.Types.ObjectId(),
    freelancer: new mongoose.Types.ObjectId(),
    status: 'confirmed',
    ...overrides,
});

beforeEach(() => {
    Gig.findById = async () => null;
    Booking.find = () => query([]);
    Booking.countDocuments = async () => 0;
    Booking.findOne = () => query(null);
    Transaction.findOne = () => query(null);
    createBookingResult = async () => ({ booking: { _id: 'booking' }, transaction: { _id: 'transaction' } });
    changeBookingResult = async () => ({ booking: { _id: 'booking' }, transaction: { _id: 'transaction' } });
});

afterEach(() => {
    Gig.findById = originalGigFindById;
    Booking.find = originalBookingFind;
    Booking.countDocuments = originalBookingCount;
    Booking.findOne = originalBookingFindOne;
    Transaction.findOne = originalTransactionFindOne;
});

describe('createBooking', () => {
    it('rejects a missing or malformed gig ID', async () => {
        for (const body of [{}, { gigId: 123 }, { gigId: 'bad-id' }]) {
            const res = response();
            await bookingController.createBooking({ body, userId: 'client-id' }, res);
            assert.equal(res.statusCode, 400);
            assert.equal(res.body.message, 'Invalid gig id');
        }
    });

    it('returns not found for a missing or inactive gig', async () => {
        const gigId = new mongoose.Types.ObjectId().toString();
        const missing = response();
        await bookingController.createBooking({ body: { gigId }, userId: 'client-id' }, missing);
        assert.equal(missing.statusCode, 404);

        Gig.findById = async () => ({ isActive: false });
        const inactive = response();
        await bookingController.createBooking({ body: { gigId }, userId: 'client-id' }, inactive);
        assert.equal(inactive.statusCode, 404);
    });

    it('prevents clients from booking their own gig', async () => {
        const clientId = new mongoose.Types.ObjectId();
        Gig.findById = async () => ({
            isActive: true,
            freelancer: clientId,
        });
        const res = response();
        await bookingController.createBooking({
            body: { gigId: new mongoose.Types.ObjectId().toString() },
            userId: String(clientId),
        }, res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'You cannot book your own gig');
    });

    it('creates a booking with its transaction', async () => {
        const gig = { isActive: true, freelancer: new mongoose.Types.ObjectId(), price: 100 };
        const result = { booking: { _id: 'booking' }, transaction: { _id: 'transaction' } };
        let args;
        Gig.findById = async () => gig;
        createBookingResult = async (...values) => {
            args = values;
            return result;
        };
        const res = response();
        await bookingController.createBooking({
            body: { gigId: new mongoose.Types.ObjectId().toString() },
            userId: 'client-id',
        }, res);
        assert.equal(res.statusCode, 201);
        assert.deepEqual(args, ['client-id', gig]);
        assert.deepEqual(res.body, result);
    });

    it('returns a server error when booking creation fails', async () => {
        Gig.findById = async () => { throw new Error('database unavailable'); };
        const res = response();
        await bookingController.createBooking({
            body: { gigId: new mongoose.Types.ObjectId().toString() },
            userId: 'client-id',
        }, res);
        assert.equal(res.statusCode, 500);
    });
});

describe('booking lists and details', () => {
    it('returns the client booking page', async () => {
        const bookings = [makeBooking()];
        Booking.find = () => query(bookings);
        Booking.countDocuments = async () => 1;
        const res = response();
        await bookingController.getMyBookings({ userId: 'client-id', query: {} }, res);
        assert.equal(res.body.bookings, bookings);
        assert.equal(res.body.total, 1);
    });

    it('handles client booking list failures', async () => {
        Booking.find = () => { throw new Error('database unavailable'); };
        const res = response();
        await bookingController.getMyBookings({ userId: 'client-id', query: {} }, res);
        assert.equal(res.statusCode, 500);
    });

    it('returns the freelancer booking page', async () => {
        const bookings = [makeBooking()];
        Booking.find = () => query(bookings);
        Booking.countDocuments = async () => 1;
        const res = response();
        await bookingController.getFreelancerBookings({ userId: 'freelancer-id', query: {} }, res);
        assert.equal(res.body.bookings, bookings);
        assert.equal(res.body.total, 1);
    });

    it('handles freelancer booking list failures', async () => {
        Booking.find = () => { throw new Error('database unavailable'); };
        const res = response();
        await bookingController.getFreelancerBookings({ userId: 'freelancer-id', query: {} }, res);
        assert.equal(res.statusCode, 500);
    });

    it('rejects a malformed booking ID', async () => {
        const res = response();
        await bookingController.getBookingById({ params: { id: 'bad-id' } }, res);
        assert.equal(res.statusCode, 400);
    });

    it('returns not found for a missing booking', async () => {
        const res = response();
        await bookingController.getBookingById({
            params: { id: new mongoose.Types.ObjectId().toString() },
            userId: 'client-id',
            userRole: 'client',
        }, res);
        assert.equal(res.statusCode, 404);
    });

    it('limits non-admin details to a booking party and includes its transaction', async () => {
        const booking = makeBooking();
        let filter;
        Booking.findOne = (value) => {
            filter = value;
            return query(booking);
        };
        const transaction = { reference: 'ref' };
        Transaction.findOne = () => query(transaction);
        const res = response();

        await bookingController.getBookingById({
            params: { id: String(booking._id) },
            userId: 'client-id',
            userRole: 'client',
        }, res);

        assert.deepEqual(filter.$or, [{ client: 'client-id' }, { freelancer: 'client-id' }]);
        assert.deepEqual(res.body, { booking, transaction });
    });

    it('does not add a party restriction for admins', async () => {
        const booking = makeBooking();
        let filter;
        Booking.findOne = (value) => {
            filter = value;
            return query(booking);
        };
        const res = response();
        await bookingController.getBookingById({
            params: { id: String(booking._id) },
            userId: 'admin-id',
            userRole: 'admin',
        }, res);
        assert.deepEqual(filter, { _id: String(booking._id) });
    });

    it('returns a server error when booking details cannot be loaded', async () => {
        Booking.findOne = () => { throw new Error('database unavailable'); };
        const res = response();
        await bookingController.getBookingById({
            params: { id: new mongoose.Types.ObjectId().toString() },
            userId: 'client-id',
            userRole: 'client',
        }, res);
        assert.equal(res.statusCode, 500);
    });
});

describe('updateBookingStatus', () => {
    const requestForStatus = (id, status, userId = 'freelancer-id') => ({
        params: { id },
        body: { status },
        userId,
    });

    it('rejects malformed IDs, unsupported statuses, and missing bookings', async () => {
        const malformed = response();
        await bookingController.updateBookingStatus(requestForStatus('bad-id', 'in_progress'), malformed);
        assert.equal(malformed.statusCode, 400);

        const invalidStatus = response();
        await bookingController.updateBookingStatus(
            requestForStatus(new mongoose.Types.ObjectId().toString(), 'cancelled'),
            invalidStatus
        );
        assert.equal(invalidStatus.statusCode, 400);

        const missing = response();
        await bookingController.updateBookingStatus(
            requestForStatus(new mongoose.Types.ObjectId().toString(), 'in_progress'),
            missing
        );
        assert.equal(missing.statusCode, 404);
    });

    it('enforces the booking status sequence', async () => {
        Booking.findOne = async () => makeBooking({ status: 'confirmed' });
        const res = response();
        await bookingController.updateBookingStatus(
            requestForStatus(new mongoose.Types.ObjectId().toString(), 'completed'),
            res
        );
        assert.equal(res.statusCode, 400);
        assert.match(res.body.message, /Cannot change a booking/);
    });

    it('returns conflict if another request changed the booking', async () => {
        Booking.findOne = async () => makeBooking({ status: 'confirmed' });
        changeBookingResult = async () => ({ booking: null, transaction: null });
        const res = response();
        await bookingController.updateBookingStatus(
            requestForStatus(new mongoose.Types.ObjectId().toString(), 'in_progress'),
            res
        );
        assert.equal(res.statusCode, 409);
    });

    it('moves a booking forward and marks completed work as paid', async () => {
        const booking = makeBooking({ status: 'confirmed' });
        let changed;
        Booking.findOne = async () => booking;
        changeBookingResult = async (...args) => {
            changed = args;
            return { booking: { ...booking, status: args[2] }, transaction: { status: args[3] } };
        };
        const res = response();
        await bookingController.updateBookingStatus(
            requestForStatus(String(booking._id), 'in_progress'),
            res
        );
        assert.equal(changed[3], null);
        assert.equal(res.body.booking.status, 'in_progress');

        booking.status = 'in_progress';
        const completed = response();
        await bookingController.updateBookingStatus(
            requestForStatus(String(booking._id), 'completed'),
            completed
        );
        assert.equal(changed[3], 'completed');
        assert.equal(completed.body.booking.status, 'completed');
    });

    it('returns a server error when status update fails', async () => {
        Booking.findOne = async () => { throw new Error('database unavailable'); };
        const res = response();
        await bookingController.updateBookingStatus(
            requestForStatus(new mongoose.Types.ObjectId().toString(), 'in_progress'),
            res
        );
        assert.equal(res.statusCode, 500);
    });
});

describe('cancelBooking', () => {
    const requestForCancel = (id, body = {}, userId = 'client-id') => ({
        params: { id },
        body,
        userId,
    });

    it('validates the booking ID, reason type, and reason length', async () => {
        const malformed = response();
        await bookingController.cancelBooking(requestForCancel('bad-id'), malformed);
        assert.equal(malformed.statusCode, 400);

        const invalidReason = response();
        await bookingController.cancelBooking(
            requestForCancel(new mongoose.Types.ObjectId().toString(), { reason: 12 }),
            invalidReason
        );
        assert.equal(invalidReason.statusCode, 400);
        assert.equal(invalidReason.body.message, 'Reason must be text');

        const longReason = response();
        await bookingController.cancelBooking(
            requestForCancel(new mongoose.Types.ObjectId().toString(), { reason: 'a'.repeat(501) }),
            longReason
        );
        assert.equal(longReason.statusCode, 400);
        assert.match(longReason.body.message, /500 characters/);
    });

    it('returns not found for a missing booking and rejects non-confirmed bookings', async () => {
        const missing = response();
        await bookingController.cancelBooking(
            requestForCancel(new mongoose.Types.ObjectId().toString()),
            missing
        );
        assert.equal(missing.statusCode, 404);

        Booking.findOne = async () => makeBooking({ status: 'in_progress' });
        const started = response();
        await bookingController.cancelBooking(
            requestForCancel(new mongoose.Types.ObjectId().toString()),
            started
        );
        assert.equal(started.statusCode, 400);
        assert.match(started.body.message, /Only confirmed bookings/);
    });

    it('returns conflict if the booking changes before cancellation completes', async () => {
        Booking.findOne = async () => makeBooking();
        changeBookingResult = async () => ({ booking: null, transaction: null });
        const res = response();
        await bookingController.cancelBooking(
            requestForCancel(new mongoose.Types.ObjectId().toString()),
            res
        );
        assert.equal(res.statusCode, 409);
    });

    it('sanitizes the optional reason and cancels the confirmed booking', async () => {
        const booking = makeBooking();
        let changed;
        Booking.findOne = async () => booking;
        changeBookingResult = async (...args) => {
            changed = args;
            return { booking: { ...booking, status: 'cancelled' }, transaction: { status: 'refunded' } };
        };

        const withReason = response();
        await bookingController.cancelBooking(
            requestForCancel(String(booking._id), { reason: ' <b>Not available</b> ' }),
            withReason
        );
        assert.deepEqual(changed[4], { cancellationReason: 'Not available' });
        assert.equal(withReason.body.booking.status, 'cancelled');

        const withoutReason = response();
        await bookingController.cancelBooking(requestForCancel(String(booking._id)), withoutReason);
        assert.deepEqual(changed[4], {});
        assert.equal(withoutReason.body.booking.status, 'cancelled');
    });

    it('returns a server error when cancellation fails', async () => {
        Booking.findOne = async () => { throw new Error('database unavailable'); };
        const res = response();
        await bookingController.cancelBooking(
            requestForCancel(new mongoose.Types.ObjectId().toString()),
            res
        );
        assert.equal(res.statusCode, 500);
    });
});
