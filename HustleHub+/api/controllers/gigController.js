const mongoose = require('mongoose');
const Gig = require('../models/Gig');
const { ROLES } = require('../utils/roles');
const { GIG_CATEGORIES } = require('../utils/gigCategories');
const { escapeRegex } = require('../utils/sanitize');
const { parsePagination, pageInfo } = require('../utils/pagination');

// Only these fields may come from the client; owner and active status are set by the API
const EDITABLE_FIELDS = ['title', 'description', 'category', 'price'];
const MAX_SEARCH_LENGTH = 100;

// Copy only the allow-listed fields that were sent in the body, for security
const pickEditableFields = (body) => {
    const fields = {};
    for (const field of EDITABLE_FIELDS) {
        if (body[field] !== undefined) fields[field] = body[field];
    }
    return fields;
};

// Find an active gig and make sure the logged-in freelancer owns it ~> (The IIE, 2026)
// Used by update and delete so one freelancer cannot change another freelancer's gig
const findOwnedGig = async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        res.status(400).json({ message: 'Invalid gig id' });
        return null;
    }

    const gig = await Gig.findById(req.params.id);
    if (!gig || !gig.isActive) {
        res.status(404).json({ message: 'Gig not found' });
        return null;
    }

    if (!gig.freelancer.equals(req.userId)) {
        res.status(403).json({ message: 'You can only change your own gigs' });
        return null;
    }

    return gig;
};

// GET /api/gigs - public list of active gigs with search, category filter and pagination
const listGigs = async (req, res) => {
    const { q, category } = req.query;
    const filter = { isActive: true };

    // Search text is escaped so it is matched literally against the title and description
    if (q !== undefined) {
        if (typeof q !== 'string' || q.length > MAX_SEARCH_LENGTH)
            return res.status(400).json({ message: `Search must be text of up to ${MAX_SEARCH_LENGTH} characters` });

        const search = q.trim();
        if (search) {
            const pattern = new RegExp(escapeRegex(search), 'i');
            filter.$or = [{ title: pattern }, { description: pattern }];
        }
    }

    // An empty category means "all categories"
    if (category !== undefined && category !== '') {
        if (!GIG_CATEGORIES.includes(category))
            return res.status(400).json({ message: 'Invalid category' });
        filter.category = category;
    }
    // Uses skip/limit pagination and countDocuments to return one page plus the total result count ~> (Mongoose, n.d.)
    const { page, limit, skip } = parsePagination(req.query);
    const [gigs, total] = await Promise.all([
        Gig.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('freelancer', 'name'), 
        Gig.countDocuments(filter),
    ]);

    res.json({ gigs, ...pageInfo(page, limit, total) });
};

// GET /api/gigs/my-gigs - the logged-in freelancers own gigs, including soft deleted ones
const getMyGigs = async (req, res) => {
    const filter = { freelancer: req.userId };

    const { page, limit, skip } = parsePagination(req.query);
    const [gigs, total] = await Promise.all([
        Gig.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Gig.countDocuments(filter),
    ]);

    res.json({ gigs, ...pageInfo(page, limit, total) });
};

// GET /api/gigs/:id - public view of one active gig; soft-deleted gigs stay hidden
const getGigById = async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id))
        return res.status(400).json({ message: 'Invalid gig id' });

    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });

    // This route is public, so req.userId is usually empty. Owners see deleted gigs through /my-gigs
    const canSeeInactive = Boolean(req.userId)
        && (gig.freelancer.equals(req.userId) || req.userRole === ROLES.ADMIN);
    if (!gig.isActive && !canSeeInactive)
        return res.status(404).json({ message: 'Gig not found' });

    await gig.populate('freelancer', 'name');
    res.json({ gig });
};

// POST /api/gigs - create a gig owned by the logged-in freelancer ~> (The IIE, 2026)
const createGig = async (req, res) => {
    const fields = pickEditableFields(req.body || {});
    const gig = await Gig.create({ ...fields, freelancer: req.userId });
    res.status(201).json({ gig });
};

// PUT /api/gigs/:id - update the freelancer's own active gig
const updateGig = async (req, res) => {
    const gig = await findOwnedGig(req, res);
    if (!gig) return;

    const fields = pickEditableFields(req.body || {});
    if (Object.keys(fields).length === 0)
        return res.status(400).json({ message: 'No editable fields provided' });

    // save() runs the schema validators, unlike findByIdAndUpdate by default
    gig.set(fields);
    await gig.save();
    res.json({ gig });
};

// DELETE /api/gigs/:id - soft delete the freelancers own gig
const deleteGig = async (req, res) => {
    const gig = await findOwnedGig(req, res);
    if (!gig) return;

    gig.isActive = false;
    await gig.save();
    res.json({ message: 'Gig deleted' });
};

module.exports = {
    listGigs,
    getMyGigs,
    getGigById,
    createGig,
    updateGig,
    deleteGig
};
//The Independent Institute of Education (IIE). 2026. Information Systems 3D (INSY7314/w): Module manual. The Independent Institute of Education (Pty) Ltd.
// Mongoose. n.d. Queries: Pagination. Available at: https://mongoosejs.com/docs/queries.html#pagination (Accessed: 8 October 2026).
