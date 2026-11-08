import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './client.js'
import { becomeFreelancer, getMe, login, register } from './auth.js'
import { getUsers, removeGig, setUserActive, setUserRole } from './admin.js'
import {
  cancelBooking,
  createBooking,
  getBooking,
  getFreelancerBookings,
  getMyBookings,
  updateBookingStatus,
} from './bookings.js'
import { createGig, deleteGig, getGig, getMyGigs, listGigs, updateGig } from './gigs.js'
import { getIncome, getMyTransactions, getTaxSummary, listAllTransactions } from './transactions.js'

vi.mock('./client.js', () => ({
  apiRequest: vi.fn(),
  withQuery: (params = {}) => {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') query.set(key, value)
    }
    const text = query.toString()
    return text ? `?${text}` : ''
  },
}))

describe('API resource functions', () => {
  beforeEach(() => apiRequest.mockClear())

  it('sends only supported authentication fields', () => {
    register({ name: 'User', email: 'u@example.test', password: 'pass', role: 'client', extra: 'ignored' })
    expect(apiRequest).toHaveBeenLastCalledWith('/api/auth/register', {
      method: 'POST',
      body: { name: 'User', email: 'u@example.test', password: 'pass', role: 'client' },
    })
    login({ email: 'u@example.test', password: 'pass', extra: true })
    expect(apiRequest).toHaveBeenLastCalledWith('/api/auth/login', {
      method: 'POST',
      body: { email: 'u@example.test', password: 'pass' },
    })
    getMe()
    expect(apiRequest).toHaveBeenLastCalledWith('/api/auth/me')
    becomeFreelancer()
    expect(apiRequest).toHaveBeenLastCalledWith('/api/auth/become-freelancer', { method: 'POST' })
  })

  it('encodes admin resource IDs and sends status and role changes', () => {
    getUsers(2)
    expect(apiRequest).toHaveBeenLastCalledWith('/api/admin/users?page=2')
    setUserActive('id/1', false)
    expect(apiRequest).toHaveBeenLastCalledWith('/api/admin/users/id%2F1/status', {
      method: 'PATCH', body: { isActive: false },
    })
    setUserRole('id/1', 'admin')
    expect(apiRequest).toHaveBeenLastCalledWith('/api/auth/users/id%2F1/role', {
      method: 'PATCH', body: { role: 'admin' },
    })
    removeGig('gig/1')
    expect(apiRequest).toHaveBeenLastCalledWith('/api/admin/gigs/gig%2F1', { method: 'DELETE' })
  })

  it('handles booking queries, status changes, and blank cancellation reasons', () => {
    createBooking('gig-id')
    expect(apiRequest).toHaveBeenLastCalledWith('/api/bookings', { method: 'POST', body: { gigId: 'gig-id' } })
    getMyBookings(3)
    expect(apiRequest).toHaveBeenLastCalledWith('/api/bookings/my-bookings?page=3')
    getFreelancerBookings()
    expect(apiRequest).toHaveBeenLastCalledWith('/api/bookings/freelancer')
    getBooking('booking/1')
    expect(apiRequest).toHaveBeenLastCalledWith('/api/bookings/booking%2F1')
    updateBookingStatus('booking/1', 'completed')
    expect(apiRequest).toHaveBeenLastCalledWith('/api/bookings/booking%2F1/status', {
      method: 'PATCH', body: { status: 'completed' },
    })
    cancelBooking('booking/1', '  ')
    expect(apiRequest).toHaveBeenLastCalledWith('/api/bookings/booking%2F1/cancel', {
      method: 'PATCH', body: { reason: undefined },
    })
    cancelBooking('booking/1', '  Changed plans  ')
    expect(apiRequest).toHaveBeenLastCalledWith('/api/bookings/booking%2F1/cancel', {
      method: 'PATCH', body: { reason: 'Changed plans' },
    })
  })

  it('builds gig queries, encodes IDs, and sends only editable gig fields', () => {
    listGigs({ q: 'logo design', category: '', page: 2 })
    expect(apiRequest).toHaveBeenLastCalledWith('/api/gigs?q=logo+design&page=2')
    getMyGigs()
    expect(apiRequest).toHaveBeenLastCalledWith('/api/gigs/my-gigs')
    getGig('gig/1')
    expect(apiRequest).toHaveBeenLastCalledWith('/api/gigs/gig%2F1')
    const gig = { title: 'Title', description: 'Details', category: 'design', price: 250, ignored: true }
    createGig(gig)
    expect(apiRequest).toHaveBeenLastCalledWith('/api/gigs', {
      method: 'POST', body: { title: 'Title', description: 'Details', category: 'design', price: 250 },
    })
    updateGig('gig/1', gig)
    expect(apiRequest).toHaveBeenLastCalledWith('/api/gigs/gig%2F1', {
      method: 'PUT', body: { title: 'Title', description: 'Details', category: 'design', price: 250 },
    })
    deleteGig('gig/1')
    expect(apiRequest).toHaveBeenLastCalledWith('/api/gigs/gig%2F1', { method: 'DELETE' })
  })

  it('requests payment lists, income, tax, and admin transaction lists', () => {
    getMyTransactions(4)
    expect(apiRequest).toHaveBeenLastCalledWith('/api/transactions/my-transactions?page=4')
    getIncome()
    expect(apiRequest).toHaveBeenLastCalledWith('/api/transactions/income')
    getTaxSummary()
    expect(apiRequest).toHaveBeenLastCalledWith('/api/transactions/tax')
    listAllTransactions(5)
    expect(apiRequest).toHaveBeenLastCalledWith('/api/transactions?page=5')
  })
})
