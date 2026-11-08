import { fireEvent, screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBooking } from '../api/bookings.js'
import { getGig } from '../api/gigs.js'
import { ADMIN, CLIENT, FREELANCER, renderWithAuth } from '../test/renderWithAuth.jsx'
import GigDetailPage from './GigDetailPage.jsx'

// The real API is never called; these API functions are replaced with pretend ones ~> (Vitest, n.d.)
vi.mock('../api/gigs.js', () => ({ getGig: vi.fn() }))
vi.mock('../api/bookings.js', () => ({ createBooking: vi.fn() }))
vi.mock('../api/admin.js', () => ({ removeGig: vi.fn() }))

const gig = {
  _id: 'a'.repeat(24),
  title: 'Logo design',
  description: 'A clean logo.',
  category: 'creative-design',
  price: 750,
  freelancer: { _id: FREELANCER.id, name: FREELANCER.name },
}

const renderGigPage = (user) =>
  renderWithAuth(
    <Routes>
      <Route path="/gigs/:id" element={<GigDetailPage />} />
    </Routes>,
    { user, route: `/gigs/${gig._id}` },
  )

describe('GigDetailPage', () => {
  beforeEach(() => {
    getGig.mockResolvedValue({ gig })
  })

  it('shows a client the Book button', async () => {
    renderGigPage(CLIENT)
    expect(await screen.findByRole('button', { name: /Book this gig for R\s?750/ })).toBeInTheDocument()
  })

  it('asks a guest to log in instead of booking', async () => {
    renderGigPage(null)
    expect(await screen.findByRole('link', { name: 'Log in to book' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Book/ })).not.toBeInTheDocument()
  })

  it('does not let a freelancer book', async () => {
    renderGigPage(FREELANCER)
    expect(await screen.findByText("Freelancer accounts can't book gigs.")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Book/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Log in to book' })).not.toBeInTheDocument()
  })

  it('shows an admin Remove gig, but no Book button', async () => {
    renderGigPage(ADMIN)
    expect(await screen.findByRole('button', { name: 'Remove gig' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Book/ })).not.toBeInTheDocument()
  })

  it('books only once when the button is clicked twice quickly', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    // The booking never finishes, so the page stays in its "booking" state
    createBooking.mockReturnValue(new Promise(() => {}))
    renderGigPage(CLIENT)

    const button = await screen.findByRole('button', { name: /Book this gig/ })
    fireEvent.click(button)
    fireEvent.click(button)

    expect(createBooking).toHaveBeenCalledTimes(1)
    expect(createBooking).toHaveBeenCalledWith(gig._id)
  })
})

// Vitest. n.d. Mocking: Modules. [online] Available at: https://vitest.dev/guide/mocking/modules (Accessed: 12 October 2026).
