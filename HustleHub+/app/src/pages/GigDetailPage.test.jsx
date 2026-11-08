import { fireEvent, screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBooking } from '../api/bookings.js'
import { removeGig } from '../api/admin.js'
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

  it('does not book when confirmation is declined, and displays booking failures', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderGigPage(CLIENT)
    fireEvent.click(await screen.findByRole('button', { name: /Book this gig/ }))
    expect(createBooking).not.toHaveBeenCalled()

    window.confirm.mockReturnValue(true)
    createBooking.mockRejectedValue(new Error('Booking failed'))
    fireEvent.click(screen.getByRole('button', { name: /Book this gig/ }))
    expect(await screen.findByText('Booking failed')).toBeInTheDocument()
  })

  it('allows admins to remove a gig after confirmation and reports errors', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderGigPage(ADMIN)
    fireEvent.click(await screen.findByRole('button', { name: 'Remove gig' }))
    expect(removeGig).not.toHaveBeenCalled()

    window.confirm.mockReturnValue(true)
    removeGig.mockRejectedValue(new Error('Removal failed'))
    fireEvent.click(screen.getByRole('button', { name: 'Remove gig' }))
    expect(await screen.findByText('Removal failed')).toBeInTheDocument()
  })

  it.each([
    [{ status: 400, message: 'Bad id' }, 'Gig not found'],
    [{ status: 404, message: 'Missing' }, 'Gig not found'],
    [{ status: 503, message: 'Unavailable' }, 'Could not load this gig'],
  ])('shows the correct message for a failed gig request', async (failure, heading) => {
    getGig.mockRejectedValue(failure)
    renderGigPage(CLIENT)
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
  })

  it('uses a fallback freelancer name when the API omits freelancer details', async () => {
    getGig.mockResolvedValue({ gig: { ...gig, freelancer: null } })
    renderGigPage(null)
    expect(await screen.findByText('by Unknown freelancer')).toBeInTheDocument()
  })
})

// Vitest. n.d. Mocking: Modules. [online] Available at: https://vitest.dev/guide/mocking/modules (Accessed: 12 October 2026).
