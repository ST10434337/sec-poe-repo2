import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthContext } from '../auth/AuthContext.js'

// Renders a component inside a router and a pretend login, so pages can be tested on their own
//  user:  the logged-in user, or null for a guest
//  route: the address the test starts on, e.g. '/gigs/123'
// Returns everything render() returns, plus auth (the pretend login, so tests can check auth.login was called)
export function renderWithAuth(ui, { user = null, route = '/' } = {}) {
  const auth = { user, login: vi.fn(), logout: vi.fn(), updateUser: vi.fn() }
  const result = render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AuthContext.Provider>,
  )
  return { ...result, auth }
}

// Test users, one per role
export const CLIENT = { id: 'c'.repeat(24), name: 'Test Client', email: 'client@example.test', role: 'client' }
export const FREELANCER = { id: 'f'.repeat(24), name: 'Test Freelancer', email: 'free@example.test', role: 'freelancer' }
export const ADMIN = { id: 'e'.repeat(24), name: 'Test Admin', email: 'admin@example.test', role: 'admin' }
