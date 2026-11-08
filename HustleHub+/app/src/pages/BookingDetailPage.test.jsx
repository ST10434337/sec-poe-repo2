import { fireEvent, screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelBooking, getBooking, updateBookingStatus } from '../api/bookings.js'
import { CLIENT, FREELANCER, renderWithAuth } from '../test/renderWithAuth.jsx'
import BookingDetailPage from './BookingDetailPage.jsx'

vi.mock('../api/bookings.js', () => ({
  cancelBooking: vi.fn(),
  getBooking: vi.fn(),
  updateBookingStatus: vi.fn(),
}))

const bookingId = 'booking-1'
const booking = (status = 'confirmed') => ({
  _id: bookingId,
  status,
  price: 750,
  createdAt: '2025-01-01',
  cancellationReason: status === 'cancelled' ? 'Changed plans' : undefined,
  gig: { title: 'Logo design' },
  client: { _id: CLIENT.id, name: CLIENT.name },
  freelancer: { _id: FREELANCER.id, name: FREELANCER.name },
})

function renderBooking(user) {
  return renderWithAuth(
    <Routes>
      <Route path="/bookings/:id" element={<BookingDetailPage />} />
    </Routes>,
    { user, route: `/bookings/${bookingId}` },
  )
}

describe('BookingDetailPage', () => {
  beforeEach(() => {
    getBooking.mockResolvedValue({
      booking: booking(),
      transaction: { reference: 'PAY-1', amount: 750, status: 'pending' },
    })
  })

  it('lets the freelancer start work only after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderBooking(FREELANCER)
    fireEvent.click(await screen.findByRole('button', { name: 'Start work' }))
    expect(updateBookingStatus).not.toHaveBeenCalled()

    window.confirm.mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: 'Start work' }))
    expect(updateBookingStatus).toHaveBeenCalledWith(bookingId, 'in_progress')
  })

  it('lets the freelancer complete in-progress work and shows payment details', async () => {
    getBooking.mockResolvedValue({
      booking: booking('in_progress'),
      transaction: { reference: 'PAY-1', amount: 750, status: 'pending' },
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderBooking(FREELANCER)

    expect(await screen.findByText('PAY-1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mark as completed' }))
    expect(updateBookingStatus).toHaveBeenCalledWith(bookingId, 'completed')
  })

  it('allows the client to cancel with a trimmed reason', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderBooking(CLIENT)
    await screen.findByRole('button', { name: 'Cancel booking' })
    fireEvent.change(screen.getByLabelText('Reason (optional)'), { target: { value: '  Changed plans  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel booking' }))
    expect(cancelBooking).toHaveBeenCalledWith(bookingId, '  Changed plans  ')
  })

  it.each([
    [{ status: 409, message: 'Conflict' }, /This booking was changed somewhere else/],
    [{ status: 400, message: 'Invalid status' }, /Invalid status\. We've refreshed the booking/],
    [{ status: 500, message: 'Server failed' }, 'Server failed'],
  ])('shows a useful message when a booking action fails', async (failure, message) => {
    updateBookingStatus.mockRejectedValue(failure)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderBooking(FREELANCER)
    fireEvent.click(await screen.findByRole('button', { name: 'Start work' }))
    expect(await screen.findByText(message)).toBeInTheDocument()
    await vi.waitFor(() => expect(getBooking).toHaveBeenCalledTimes(2))
  })

  it.each([
    ['completed', 'This booking is completed. The payment was released to the freelancer.'],
    ['cancelled', 'This booking was cancelled. The payment was refunded to the client.'],
    ['in_progress', 'The freelancer is working on this, so it can no longer be cancelled.'],
  ])('shows the correct terminal or in-progress message for %s', async (status, message) => {
    getBooking.mockResolvedValue({ booking: booking(status), transaction: null })
    renderBooking(CLIENT)
    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel booking' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Start work|Mark as completed/ })).not.toBeInTheDocument()
  })

  it('distinguishes missing bookings from other load errors', async () => {
    getBooking.mockRejectedValueOnce({ status: 404, message: 'Not found' })
    renderBooking(CLIENT)
    expect(await screen.findByRole('heading', { name: 'Booking not found' })).toBeInTheDocument()

    getBooking.mockRejectedValue({ status: 503, message: 'Unavailable' })
    renderBooking(CLIENT)
    expect(await screen.findByRole('heading', { name: 'Could not load this booking' })).toBeInTheDocument()
  })
})
