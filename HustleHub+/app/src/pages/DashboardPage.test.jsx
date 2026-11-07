import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getIncome, getTaxSummary } from '../api/transactions.js'
import { ApiError } from '../api/client.js'
import { FREELANCER, renderWithAuth } from '../test/renderWithAuth.jsx'
import { SUMMARY_300K, SUMMARY_80K } from '../test/taxSummaries.js'
import DashboardPage from './DashboardPage.jsx'

// The real API is never called; these API functions are replaced with pretend ones ~> (Vitest, n.d.)
vi.mock('../api/transactions.js', () => ({ getIncome: vi.fn(), getTaxSummary: vi.fn() }))

const INCOME = { currency: 'ZAR', earned: 300000, pending: 20000, refunded: 1500, completedCount: 7 }

const renderDashboard = () => renderWithAuth(<DashboardPage />, { user: FREELANCER, route: '/dashboard' })

describe('DashboardPage', () => {
  beforeEach(() => {
    getIncome.mockResolvedValue(INCOME)
    getTaxSummary.mockResolvedValue(SUMMARY_300K)
  })

  it('shows loading messages while both requests are on their way', () => {
    getIncome.mockReturnValue(new Promise(() => {}))
    getTaxSummary.mockReturnValue(new Promise(() => {}))
    renderDashboard()

    expect(screen.getByText('Loading income…')).toBeInTheDocument()
    expect(screen.getByText('Working out your tax…')).toBeInTheDocument()
  })

  it('shows income, the tax estimate, the split bar, the monthly chart and the working', async () => {
    renderDashboard()

    expect(await screen.findByRole('heading', { name: 'Estimated tax for 2026/27' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Income summary' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Tax estimate' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /you keep R\s?259\s?428/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Paid income by month' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /Paid income by month for the 2026\/27 tax year/ })).toBeInTheDocument()
    expect(screen.getByText('How this is worked out')).toBeInTheDocument()
    expect(screen.getByText(/not tax advice\. Check with SARS/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See every payment' })).toHaveAttribute('href', '/transactions')
  })

  it('says what pending work would add to the tax', async () => {
    renderDashboard()

    expect(
      await screen.findByText(
        /R\s?20\s?000 of work that isn't paid yet\. If it's paid this tax year, your estimated tax goes up by R\s?5\s?200 to R\s?45\s?772\./,
      ),
    ).toBeInTheDocument()
  })

  it('leaves the pending note out when nothing is pending', async () => {
    getTaxSummary.mockResolvedValue(SUMMARY_80K)
    renderDashboard()

    await screen.findByRole('heading', { name: 'Estimated tax for 2026/27' })
    expect(screen.queryByText(/isn't paid yet/)).not.toBeInTheDocument()
  })

  it('shows a tax error without hiding the income', async () => {
    getTaxSummary.mockRejectedValue(new ApiError(500, 'Something went wrong. Please try again.'))
    renderDashboard()

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Please try again.')
    expect(await screen.findByRole('region', { name: 'Income summary' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Tax estimate' })).not.toBeInTheDocument()
  })
})
