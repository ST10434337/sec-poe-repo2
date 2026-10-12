import { apiRequest, withQuery } from './client.js'

// GET /api/admin/users - every user, without passwords
export const getUsers = (page) => apiRequest(`/api/admin/users${withQuery({ page })}`)

// PATCH /api/admin/users/:id/status - enable (true) or disable (false) an account: { user }
export const setUserActive = (id, isActive) =>
  apiRequest(`/api/admin/users/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { isActive } })

// PATCH /api/auth/users/:userId/role - role must be freelancer or admin: { user }
// This one lives under /api/auth on the API, but it is an admin feature
export const setUserRole = (id, role) =>
  apiRequest(`/api/auth/users/${encodeURIComponent(id)}/role`, { method: 'PATCH', body: { role } })

// DELETE /api/admin/gigs/:id - moderation: hide any gig
export const removeGig = (id) => apiRequest(`/api/admin/gigs/${encodeURIComponent(id)}`, { method: 'DELETE' })
