import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { getFreelancerBookings, getMyBookings } from '../api/bookings.js'
import { CLIENT, FREELANCER, renderWithAuth } from '../test/renderWithAuth.jsx'
import BookingsPage from './BookingsPage.jsx'

vi.mock('../api/bookings.js', () => ({
  getFreelancerBookings: vi.fn(),
  getMyBookings: vi.fn(),
}))

function renderBookings(user) {
  return renderWithAuth(
    <Routes>
      <Route path="/bookings" element={<BookingsPage />} />
    </Routes>,
    { user, route: '/bookings' },
  )
}

describe('BookingsPage', () => {
  it('shows the client empty state and requests client bookings', async () => {
    getMyBookings.mockResolvedValue({ bookings: [], page: 1, totalPages: 1 })
    renderBookings(CLIENT)
    expect(await screen.findByText(/You haven't booked any gigs yet/)).toBeInTheDocument()
    expect(getMyBookings).toHaveBeenCalledWith(1)
  })

  it('shows the freelancer list with participant, fallback, and removed-gig labels', async () => {
    getFreelancerBookings.mockResolvedValue({
      bookings: [{
        _id: 'booking-1',
        gig: null,
        client: null,
        freelancer: { name: 'Ignored for freelancer list' },
        price: 300,
        status: 'confirmed',
        createdAt: '2025-01-01T00:00:00Z',
      }],
      page: 1,
      totalPages: 2,
    })
    renderBookings(FREELANCER)
    expect(await screen.findByText('Bookings on my gigs')).toBeInTheDocument()
    expect(screen.getByText('Gig removed')).toBeInTheDocument()
    expect(screen.getByText('Unknown')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View/ })).toHaveAttribute('href', '/bookings/booking-1')
    expect(getFreelancerBookings).toHaveBeenCalledWith(1)
  })

  it('shows the freelancer empty state and load failures', async () => {
    getFreelancerBookings.mockResolvedValue({ bookings: [], page: 1, totalPages: 1 })
    renderBookings(FREELANCER)
    expect(await screen.findByText('No bookings yet. They will show here when clients book your gigs.')).toBeInTheDocument()
  })

  it('shows booking load failures', async () => {
    getMyBookings.mockRejectedValue(new Error('Request failed'))
    renderBookings(CLIENT)
    expect(await screen.findByText('Request failed')).toBeInTheDocument()
  })
})
