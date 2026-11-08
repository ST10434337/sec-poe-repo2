import { fireEvent, screen, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getUsers, setUserActive, setUserRole } from '../api/admin.js'
import { ADMIN, renderWithAuth } from '../test/renderWithAuth.jsx'
import AdminUsersPage from './AdminUsersPage.jsx'

vi.mock('../api/admin.js', () => ({
  getUsers: vi.fn(),
  setUserActive: vi.fn(),
  setUserRole: vi.fn(),
}))

const users = [
  { _id: 'admin-id', name: 'Admin', email: ADMIN.email, role: 'admin', isActive: true, createdAt: '2025-01-01' },
  { _id: 'client-id', name: 'Client', email: 'client@example.test', role: 'client', isActive: true, createdAt: '2025-01-02' },
  { _id: 'disabled-id', name: 'Disabled', email: 'disabled@example.test', role: 'freelancer', isActive: false, createdAt: '2025-01-03' },
]

function renderUsers() {
  return renderWithAuth(
    <Routes>
      <Route path="/admin/users" element={<AdminUsersPage />} />
    </Routes>,
    { user: ADMIN, route: '/admin/users' },
  )
}

describe('AdminUsersPage', () => {
  beforeEach(() => {
    getUsers.mockResolvedValue({ users, page: 1, totalPages: 1 })
  })

  it('shows user statuses, role choices, and protects the current admin', async () => {
    renderUsers()
    expect(await screen.findByText('Users')).toBeInTheDocument()
    expect(screen.getByText('This is you')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Disabled disabled@example\.test/ })).toHaveTextContent('Disabled')
    expect(screen.getByRole('button', { name: /Make freelancer: Client/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Make admin: Client/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Make freelancer: Admin/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Enable: Disabled/ })).toBeInTheDocument()
  })

  it('does not make a change when confirmation is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderUsers()
    fireEvent.click(await screen.findByRole('button', { name: /Disable: Client/ }))
    expect(setUserActive).not.toHaveBeenCalled()
  })

  it('updates active status and role in place after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    setUserActive.mockResolvedValue({ user: { isActive: false } })
    setUserRole.mockResolvedValue({ user: { role: 'freelancer' } })
    renderUsers()

    fireEvent.click(await screen.findByRole('button', { name: /Disable: Client/ }))
    const clientRow = screen.getByRole('row', { name: /Client client@example\.test/ })
    expect(setUserActive).toHaveBeenCalledWith('client-id', false)
    expect(await within(clientRow).findByRole('button', { name: /Enable: Client/ })).toBeInTheDocument()

    fireEvent.click(within(clientRow).getByRole('button', { name: /Make freelancer: Client/ }))
    expect(await within(clientRow).findByText('Freelancer')).toBeInTheDocument()
    expect(setUserRole).toHaveBeenCalledWith('client-id', 'freelancer')
  })

  it('shows API errors and keeps a failed row unchanged', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    setUserRole.mockRejectedValue(new Error('Role change failed'))
    renderUsers()
    fireEvent.click(await screen.findByRole('button', { name: /Make freelancer: Client/ }))
    expect(await screen.findByText('Role change failed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Make freelancer: Client/ })).toBeInTheDocument()
  })

  it('shows list errors', async () => {
    getUsers.mockRejectedValue(new Error('Could not load users'))
    renderUsers()
    expect(await screen.findByText('Could not load users')).toBeInTheDocument()
  })
})
