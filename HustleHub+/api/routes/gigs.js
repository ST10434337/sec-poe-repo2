const express = require('express');
const router = express.Router();
const { allowRoles } = require('../middleware/auth');
const { ROLES } = require('../utils/roles');

const {
    listGigs,
    getMyGigs,
    getGigById,
    createGig,
    updateGig,
    deleteGig
} = require('../controllers/gigController');

// Public: Anyone can browse active gigs
router.get('/', listGigs);

// Public: Anyone can open an active gig
// Booking still happens in the bookings routes and will require login
router.get('/:id', getGigById);

// Freelancers can see their own gigs, including ones they deleted
// Keep this before /:id so "my-gigs" is not treated as a gig id
router.get('/my-gigs', allowRoles(ROLES.FREELANCER), getMyGigs);

// Management: create, update and soft delete are freelancer only, ownership is checked in the controller
router.post('/', allowRoles(ROLES.FREELANCER), createGig);
router.put('/:id', allowRoles(ROLES.FREELANCER), updateGig);
router.delete('/:id', allowRoles(ROLES.FREELANCER), deleteGig);

module.exports = router;
//The Independent Institute of Education (IIE). 2026. Information Systems 3D (INSY7314/w): Module manual. The Independent Institute of Education (Pty) Ltd.
