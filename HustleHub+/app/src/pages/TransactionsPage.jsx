import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getIncome, getMyTransactions } from '../api/transactions.js'
import { useAuth } from '../auth/AuthContext.js'
import { useApi } from '../hooks/useApi.js'
import Alert from '../components/Alert.jsx'
import IncomeSummary from '../components/IncomeSummary.jsx'
import Pagination from '../components/Pagination.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { ROLES } from '../utils/constants.js'
import { formatDate, formatRand } from '../utils/format.js'

// Clients see the payments they made; freelancers see the payments they received, plus their income totals
// Every booking creates one simulated payment, so each row links to its booking
function TransactionsPage() {
  const { user } = useAuth()
  const isFreelancer = user.role === ROLES.FREELANCER
  const [page, setPage] = useState(1)

  const payments = useApi(() => getMyTransactions(page), [page])
  // Only freelancers have income; clients skip this request
  const income = useApi(() => (isFreelancer ? getIncome() : Promise.resolve(null)), [isFreelancer])

  const { data, error, loading } = payments

  return (
    <>
      <h1>{isFreelancer ? 'Income' : 'My payments'}</h1>

      {isFreelancer && (
        <>
          {income.loading && <p className="muted">Loading income…</p>}
          {!income.loading && income.error && <Alert type="error">{income.error}</Alert>}
          {!income.loading && income.data && <IncomeSummary income={income.data} />}
          <h2>Payments received</h2>
        </>
      )}

      {loading && <p className="muted">Loading payments…</p>}
      {!loading && error && <Alert type="error">{error}</Alert>}

      {!loading && data && data.transactions.length === 0 && (
        <p className="card">
          {isFreelancer ? (
            'No payments yet. They will show here when clients book your gigs.'
          ) : (
            <>
              No payments yet. <Link to="/gigs">Browse gigs</Link>
            </>
          )}
        </p>
      )}

      {!loading && data && data.transactions.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Gig</th>
                  <th scope="col">{isFreelancer ? 'Client' : 'Freelancer'}</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Status</th>
                  <th scope="col">Reference</th>
                  <th scope="col">
                    <span className="sr-only">Booking</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((payment) => (
                  <tr key={payment._id}>
                    <td>{formatDate(payment.createdAt)}</td>
                    <td>{payment.booking?.gig?.title ?? 'Gig removed'}</td>
                    {/* The API only sends the other person's name, never their email */}
                    <td>{(isFreelancer ? payment.client?.name : payment.freelancer?.name) ?? 'Unknown'}</td>
                    <td>{formatRand(payment.amount)}</td>
                    <td>
                      <StatusBadge kind="payment" status={payment.status} />
                    </td>
                    <td className="reference">{payment.reference}</td>
                    <td>
                      {payment.booking?._id && (
                        <Link to={`/bookings/${payment.booking._id}`} className="btn btn-secondary btn-small">
                          View booking<span className="sr-only">: {payment.reference}</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </>
  )
}

export default TransactionsPage
