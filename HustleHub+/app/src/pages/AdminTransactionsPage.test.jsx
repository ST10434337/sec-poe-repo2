import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { listAllTransactions } from '../api/transactions.js'
import { ADMIN, renderWithAuth } from '../test/renderWithAuth.jsx'
import AdminTransactionsPage from './AdminTransactionsPage.jsx'

vi.mock('../api/transactions.js', () => ({ listAllTransactions: vi.fn() }))

function renderAdminTransactions() {
  return renderWithAuth(
    <Routes><Route path="/admin/transactions" element={<AdminTransactionsPage />} /></Routes>,
    { user: ADMIN, route: '/admin/transactions' },
  )
}

describe('AdminTransactionsPage', () => {
  it('shows the empty state', async () => {
    listAllTransactions.mockResolvedValue({ transactions: [], page: 1, totalPages: 1 })
    renderAdminTransactions()
    expect(await screen.findByText('No transactions yet.')).toBeInTheDocument()
  })

  it('shows transaction details, fallback names, and booking link', async () => {
    listAllTransactions.mockResolvedValue({
      transactions: [{
        _id: 'payment-1',
        booking: { _id: 'booking-1', gig: null },
        client: null,
        freelancer: { name: 'Freelancer Name' },
        amount: 500,
        status: 'completed',
        reference: 'PAY-1',
        createdAt: '2025-02-01',
      }],
      page: 1,
      totalPages: 2,
      total: 1,
    })
    renderAdminTransactions()
    expect(await screen.findByText('1 transaction')).toBeInTheDocument()
    expect(screen.getByText('Gig removed')).toBeInTheDocument()
    expect(screen.getByText('Unknown')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View booking/ })).toHaveAttribute('href', '/bookings/booking-1')
  })

  it('shows list errors', async () => {
    listAllTransactions.mockRejectedValue(new Error('Could not load transactions'))
    renderAdminTransactions()
    expect(await screen.findByText('Could not load transactions')).toBeInTheDocument()
  })
})
