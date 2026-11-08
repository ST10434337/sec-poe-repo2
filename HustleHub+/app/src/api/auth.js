import { apiRequest } from './client.js'

// Each function sends only the fields the API expects, so extra form values (like the
// confirm password box) are never sent

// POST /api/auth/register - returns { token, user }
export const register = ({ name, email, password, role }) =>
  apiRequest('/api/auth/register', { method: 'POST', body: { name, email, password, role } })

// POST /api/auth/login - returns { token, user }
export const login = ({ email, password }) =>
  apiRequest('/api/auth/login', { method: 'POST', body: { email, password } })

// GET /api/auth/me - returns { name, email, role }
export const getMe = () => apiRequest('/api/auth/me')

// POST /api/auth/become-freelancer - returns a new { token, user }
export const becomeFreelancer = () => apiRequest('/api/auth/become-freelancer', { method: 'POST' })
