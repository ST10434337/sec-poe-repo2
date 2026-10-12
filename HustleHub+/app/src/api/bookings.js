import { apiRequest, withQuery } from './client.js'

const bookingPath = (id) => `/api/bookings/${encodeURIComponent(id)}`

// POST /api/bookings - client books a gig: { booking, transaction }
// Only the gig id is sent; the API sets the client, freelancer and price itself
export const createBooking = (gigId) => apiRequest('/api/bookings', { method: 'POST', body: { gigId } })

// GET /api/bookings/my-bookings - bookings the client made
export const getMyBookings = (page) => apiRequest(`/api/bookings/my-bookings${withQuery({ page })}`)

// GET /api/bookings/freelancer - bookings on the freelancer's gigs
export const getFreelancerBookings = (page) => apiRequest(`/api/bookings/freelancer${withQuery({ page })}`)

// GET /api/bookings/:id - one booking and its payment: { booking, transaction }
export const getBooking = (id) => apiRequest(bookingPath(id))

// PATCH /api/bookings/:id/status - freelancer moves it to in_progress, then completed
export const updateBookingStatus = (id, status) =>
  apiRequest(`${bookingPath(id)}/status`, { method: 'PATCH', body: { status } })

// PATCH /api/bookings/:id/cancel - client cancels; the reason is optional, so blank is not sent
export const cancelBooking = (id, reason = '') =>
  apiRequest(`${bookingPath(id)}/cancel`, { method: 'PATCH', body: { reason: reason.trim() || undefined } })
