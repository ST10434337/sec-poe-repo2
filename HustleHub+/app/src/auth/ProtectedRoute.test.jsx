import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ADMIN, CLIENT, renderWithAuth } from '../test/renderWithAuth.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'

// An admin-only page behind the guard, and a stand-in login page
const renderAdminPage = (user) =>
  renderWithAuth(
    <Routes>
      <Route path="/login" element={<p>Login page</p>} />
      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin/users" element={<p>Admin page</p>} />
      </Route>
    </Routes>,
    { user, route: '/admin/users' },
  )

describe('ProtectedRoute', () => {
  it('sends a logged-out visitor to the login page', () => {
    renderAdminPage(null)
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Admin page')).not.toBeInTheDocument()
  })

  it('blocks a user with the wrong role', () => {
    renderAdminPage(CLIENT)
    expect(screen.getByText("You don't have access to this page.")).toBeInTheDocument()
    expect(screen.queryByText('Admin page')).not.toBeInTheDocument()
  })

  it('lets a user with the right role in', () => {
    renderAdminPage(ADMIN)
    expect(screen.getByText('Admin page')).toBeInTheDocument()
  })
})
