import { fireEvent, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../auth/AuthContext.js'
import { ADMIN, CLIENT, FREELANCER } from '../test/renderWithAuth.jsx'
import Layout from './Layout.jsx'
import NavBar from './NavBar.jsx'
import Pagination from './Pagination.jsx'
import StatusBadge from './StatusBadge.jsx'
import { render } from '@testing-library/react'

function renderNav(user, logout = vi.fn()) {
  return render(
    <AuthContext.Provider value={{ user, logout }}>
      <MemoryRouter initialEntries={['/gigs']}>
        <NavBar />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('shared components', () => {
  it('shows guest navigation without account actions', () => {
    renderNav(null)
    expect(screen.getByRole('link', { name: 'Browse gigs' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument()
  })

  it.each([
    [CLIENT, 'My bookings', 'My payments'],
    [FREELANCER, 'Dashboard', 'My gigs'],
    [ADMIN, 'Users', 'All transactions'],
  ])('shows the links for role %s', (user, firstLink, secondLink) => {
    renderNav(user)
    expect(screen.getByText(`Hi, ${user.name}`)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: firstLink })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: secondLink })).toBeInTheDocument()
  })

  it('logs out and navigates to login with a message', () => {
    const logout = vi.fn()
    renderNav(CLIENT, logout)
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }))
    expect(logout).toHaveBeenCalledOnce()
  })

  it('renders navigation controls only when there is more than one page', () => {
    const onChange = vi.fn()
    const { rerender } = render(<Pagination page={1} totalPages={1} onChange={onChange} />)
    expect(screen.queryByRole('navigation', { name: 'Pages' })).not.toBeInTheDocument()
    rerender(<Pagination page={1} totalPages={3} onChange={onChange} />)
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onChange).toHaveBeenCalledWith(2)
    rerender(<Pagination page={3} totalPages={3} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('uses the status label and tone appropriate to booking and payment states', () => {
    const { rerender } = render(<StatusBadge status="confirmed" />)
    expect(screen.getByText('Confirmed')).toHaveClass('badge-info')
    rerender(<StatusBadge kind="payment" status="pending" />)
    expect(screen.getByText('Pending')).toHaveClass('badge-warning')
    rerender(<StatusBadge kind="payment" status="unknown" />)
    expect(screen.getByText('unknown')).toHaveClass('badge-muted')
  })

  it('shows route-state messages above the page content', () => {
    render(
      <AuthContext.Provider value={{ user: null, logout: vi.fn() }}>
        <MemoryRouter initialEntries={[{ pathname: '/test', state: { message: 'Saved', type: 'success' } }]}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/test" element={<p>Page content</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })
})
