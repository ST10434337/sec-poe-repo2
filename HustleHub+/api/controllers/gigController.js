const mongoose = require('mongoose');
const Gig = require('../models/Gig');
const { GIG_CATEGORIES } = require('../utils/gigCategories');
const { escapeRegex, stripTags } = require('../utils/sanitize');
const { parsePagination, pageInfo } = require('../utils/pagination');

const logger = require('../utils/logger');
const gigLogger = logger.child({ tag: 'GIGS' });

// Only these fields may come from the client; owner and active status are set by the API
const EDITABLE_FIELDS = ['title', 'description', 'category', 'price'];
// Free-text fields that have HTML tags stripped before they are checked and saved
const TEXT_FIELDS = ['title', 'description'];
const MAX_SEARCH_LENGTH = 100;

// Copy only the allow-listed fields that were sent in the body, for security
const pickEditableFields = (body) => {
    const fields = {};
    for (const field of EDITABLE_FIELDS) {
        if (body[field] !== undefined) fields[field] = body[field];
    }
    for (const field of TEXT_FIELDS) {
        if (typeof fields[field] === 'string') fields[field] = stripTags(fields[field]).trim();
    }
    return fields;
};

const isTextOfLength = (value, min, max) =>
    typeof value === 'string' && value.length >= min && value.length <= max;

// Check the gig fields before saving. Returns error or null if all is fine
// RequireALl true on create ( all needed ) false on update (only check sent fields)
const validateGigFields = (fields, requireAll) => {
    if (requireAll && EDITABLE_FIELDS.some((field) => fields[field] === undefined))
        return 'Title, description, category and price are required';
    if (fields.title !== undefined && !isTextOfLength(fields.title, 3, 100))
        return 'Title must be text of 3 to 100 characters';
    if (fields.description !== undefined && !isTextOfLength(fields.description, 10, 2000))
        return 'Description must be text of 10 to 2000 characters';
    if (fields.category !== undefined && !GIG_CATEGORIES.includes(fields.category))
        return 'Invalid category';
    // Must be a real number, reject like "200"
    if (fields.price !== undefined && !(Number.isInteger(fields.price) && fields.price >= 1 && fields.price <= 1000000))
        return 'Price must be a whole number from 1 to 1000000';
    return null;
};

// Find an active gig and make sure the logged-in freelancer owns it ~> (The IIE, 2026)
// Used by update and delete so one freelancer cannot change another freelancer's gig
const findOwnedGig = async (req, res) => {
    try {
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

        gigLogger.info(`Freelancer ${req.userId} accessed gig ${gig._id}`);
        return gig;
    } catch (error) {
        gigLogger.error(`Error finding owned gig: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
        return null;
    }
};

// GET /api/gigs - public list of active gigs with search, category filter and pagination
const listGigs = async (req, res) => {
    try {
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

        gigLogger.info(`Public gigs list accessed - page ${page}, limit ${limit}, total ${total}`);
        res.json({ gigs, ...pageInfo(page, limit, total) });
    } catch (error) {
        gigLogger.error(`Error listing gigs: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// GET /api/gigs/my-gigs - the logged-in freelancers own gigs, including soft deleted ones
const getMyGigs = async (req, res) => {
    try {
        const filter = { freelancer: req.userId };

        const { page, limit, skip } = parsePagination(req.query);
        const [gigs, total] = await Promise.all([
            Gig.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Gig.countDocuments(filter),
        ]);

        gigLogger.info(`Freelancer ${req.userId} accessed their gigs - page ${page}, limit ${limit}, total ${total}`);
        res.json({ gigs, ...pageInfo(page, limit, total) });
    } catch (error) {
        gigLogger.error(`Error getting freelancer's gigs: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// GET /api/gigs/:id - public view of one active gig; soft-deleted gigs stay hidden
const getGigById = async (req, res) => {
    try {
        if (!mongoose.isObjectIdOrHexString(req.params.id))
            return res.status(400).json({ message: 'Invalid gig id' });

        const gig = await Gig.findById(req.params.id);
        if (!gig) return res.status(404).json({ message: 'Gig not found' });

        // Public users can only view active gigs. Owners see deleted gigs through /my-gigs.
        if (!gig.isActive)
            return res.status(404).json({ message: 'Gig not found' });

        gigLogger.info(`Public gig accessed: ${gig._id}`);
        await gig.populate('freelancer', 'name');
        res.json({ gig });
    } catch (error) {
        gigLogger.error(`Error getting gig by id: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// POST /api/gigs - create a gig owned by the logged-in freelancer ~> (The IIE, 2026)
const createGig = async (req, res) => {
    try {
        const fields = pickEditableFields(req.body || {});
        const error = validateGigFields(fields, true);
        if (error) return res.status(400).json({ message: error });

        const gig = await Gig.create({ ...fields, freelancer: req.userId });
        gigLogger.info(`Freelancer ${req.userId} created gig ${gig._id}`);
        res.status(201).json({ gig });
    } catch (error) {
        gigLogger.error(`Error creating gig: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// PUT /api/gigs/:id - update the freelancer's own active gig
const updateGig = async (req, res) => {
    try {
        const gig = await findOwnedGig(req, res);
        if (!gig) return;

        const fields = pickEditableFields(req.body || {});
        if (Object.keys(fields).length === 0)
            return res.status(400).json({ message: 'No editable fields provided' });

        const error = validateGigFields(fields, false);
        if (error) return res.status(400).json({ message: error });

        // save() runs the schema validators, unlike findByIdAndUpdate by default
        gig.set(fields);
        await gig.save();
        gigLogger.info(`Freelancer ${req.userId} updated gig ${gig._id}`);
        res.json({ gig });
    } catch (error) {
        gigLogger.error(`Error updating gig: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// DELETE /api/gigs/:id - soft delete the freelancers own gig
const deleteGig = async (req, res) => {
    try {
        const gig = await findOwnedGig(req, res);
        if (!gig) return;

        gig.isActive = false;
        await gig.save();
        gigLogger.info(`Freelancer ${req.userId} soft-deleted gig ${gig._id}`);
        res.json({ message: 'Gig deleted' });
    } catch (error) {
        gigLogger.error(`Error deleting gig: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
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
