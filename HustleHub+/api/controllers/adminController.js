const mongoose = require('mongoose');
const User = require('../models/User');
const Gig = require('../models/Gig');
const { parsePagination, pageInfo } = require('../utils/pagination');
const logger = require('../utils/logger'); // Import the logger utility
const userId = require('../utils/logUtils'); // Import the logUtils utility
const adminLogger = logger.child({ tag: 'ADMIN'});


// GET /api/admin/users - every user, newest first; passwords are never returned ~> (The IIE, 2026)
const getUsers = async (req, res) => {
    adminLogger.info({userId: userId}, 'Called getUsers');
    const { page, limit, skip } = parsePagination(req.query);
    const [users, total] = await Promise.all([
        User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(),
    ]);

    res.json({ users, ...pageInfo(page, limit, total) });
};

// PATCH /api/admin/users/:id/status - enable or disable a user account
const updateUserStatus = async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id))
        return res.status(400).json({ message: 'Invalid user id' });

    // Must be a real boolean, so strings like "false" are not treated as true
    const { isActive } = req.body || {};
    if (typeof isActive !== 'boolean')
        return res.status(400).json({ message: 'isActive must be true or false' });

    // An admin cannot disable their own account, so they cannot lock themselves out by mistake
    if (!isActive && new mongoose.Types.ObjectId(req.params.id).equals(req.userId))
        return res.status(403).json({ message: 'You cannot disable your own account' });

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive },
        { returnDocument: 'after', runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    adminLogger.info({userId: req.userId}, `Updated user: ${user._id} status`);
    res.json({ user });
};

// DELETE /api/admin/gigs/:id - moderation soft delete of any active gig
const deleteGigAsAdmin = async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id))
        return res.status(400).json({ message: 'Invalid gig id' });

    // Soft delete keeps the gig for existing bookings and transactions; an already deleted gig is a 404
    const gig = await Gig.findOneAndUpdate(
        { _id: req.params.id, isActive: true },
        { isActive: false },
        { returnDocument: 'after' }
    );
    if (!gig) return res.status(404).json({ message: 'Gig not found' });

    adminLogger.info({userId: req.userId}, `Deleted gig: ${gig._id}`);
    res.json({ message: 'Gig deleted' });
};

module.exports = {
    getUsers,
    updateUserStatus,
    deleteGigAsAdmin
};
//The Independent Institute of Education (IIE). 2026. Information Systems 3D (INSY7314/w): Module manual. The Independent Institute of Education (Pty) Ltd.
