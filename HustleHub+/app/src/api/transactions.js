import { apiRequest, withQuery } from './client.js'

// GET /api/transactions/my-transactions - payments a client made, or a freelancer received
export const getMyTransactions = (page) => apiRequest(`/api/transactions/my-transactions${withQuery({ page })}`)

// GET /api/transactions/income - freelancer totals: { currency, earned, pending, refunded, completedCount }
export const getIncome = () => apiRequest('/api/transactions/income')

// GET /api/transactions/tax - freelancer tax estimate for this tax year:
// { currency, taxYear, earned, pending, estimate, ifPendingPaid, monthly }
export const getTaxSummary = () => apiRequest('/api/transactions/tax')

// GET /api/transactions - every transaction, for admins
export const listAllTransactions = (page) => apiRequest(`/api/transactions${withQuery({ page })}`)
