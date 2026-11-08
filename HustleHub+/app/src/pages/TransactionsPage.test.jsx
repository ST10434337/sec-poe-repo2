import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { getMyTransactions } from '../api/transactions.js'
import { CLIENT, FREELANCER, renderWithAuth } from '../test/renderWithAuth.jsx'
import TransactionsPage from './TransactionsPage.jsx'

vi.mock('../api/transactions.js', () => ({ getMyTransactions: vi.fn() }))

function renderTransactions(user) {
  return renderWithAuth(
    <Routes><Route path="/transactions" element={<TransactionsPage />} /></Routes>,
    { user, route: '/transactions' },
  )
}

describe('TransactionsPage', () => {
  it('shows the client empty state and browse link', async () => {
    getMyTransactions.mockResolvedValue({ transactions: [], page: 1, totalPages: 1 })
    renderTransactions(CLIENT)
    expect(await screen.findByText(/No payments yet/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse gigs' })).toHaveAttribute('href', '/gigs')
  })

  it('shows freelancer payment details and a dashboard link', async () => {
    getMyTransactions.mockResolvedValue({
      transactions: [{
        _id: 'payment-1',
        booking: { _id: 'booking-1', gig: null },
        client: { name: 'Client Person' },
        amount: 800,
        status: 'pending',
        reference: 'PAY-1',
        createdAt: '2025-02-01',
      }],
      page: 1,
      totalPages: 1,
    })
    renderTransactions(FREELANCER)
    expect(await screen.findByText('Payments received')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByText('Client Person')).toBeInTheDocument()
    expect(screen.getByText('Gig removed')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View booking/ })).toHaveAttribute('href', '/bookings/booking-1')
  })

  it('shows an error when the transaction list cannot load', async () => {
    getMyTransactions.mockRejectedValue(new Error('Payments unavailable'))
    renderTransactions(CLIENT)
    expect(await screen.findByText('Payments unavailable')).toBeInTheDocument()
  })
})
