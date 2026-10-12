import { apiRequest, withQuery } from './client.js'

// Ids come from the URL, so they are encoded before going into the request path
const gigPath = (id) => `/api/gigs/${encodeURIComponent(id)}`

// Only the fields a freelancer may edit; price must be a number, not text
const gigBody = ({ title, description, category, price }) => ({ title, description, category, price })

// GET /api/gigs - public list of active gigs: { gigs, page, limit, total, totalPages }
export const listGigs = ({ q, category, page } = {}) => apiRequest(`/api/gigs${withQuery({ q, category, page })}`)

// GET /api/gigs/my-gigs - the freelancer's own gigs, including deleted ones
export const getMyGigs = (page) => apiRequest(`/api/gigs/my-gigs${withQuery({ page })}`)

// GET /api/gigs/:id - one active gig: { gig }
export const getGig = (id) => apiRequest(gigPath(id))

export const createGig = (gig) => apiRequest('/api/gigs', { method: 'POST', body: gigBody(gig) })

export const updateGig = (id, gig) => apiRequest(gigPath(id), { method: 'PUT', body: gigBody(gig) })

// Soft delete: the gig is hidden but kept for its bookings
export const deleteGig = (id) => apiRequest(gigPath(id), { method: 'DELETE' })
