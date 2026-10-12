import { useState } from 'react'
import { Link } from 'react-router-dom'
import { listAllTransactions } from '../api/transactions.js'
import { useApi } from '../hooks/useApi.js'
import Alert from '../components/Alert.jsx'
import Pagination from '../components/Pagination.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { formatDate, formatRand } from '../utils/format.js'

// Every simulated payment on HustleHub+, for admins; each row links to its booking
function AdminTransactionsPage() {
  const [page, setPage] = useState(1)
  const { data, error, loading } = useApi(() => listAllTransactions(page), [page])

  return (
    <>
      <h1>All transactions</h1>

      {loading && <p className="muted">Loading transactions…</p>}
      {!loading && error && <Alert type="error">{error}</Alert>}

      {!loading && data && data.transactions.length === 0 && <p className="card">No transactions yet.</p>}

      {!loading && data && data.transactions.length > 0 && (
        <>
          <p className="results-summary">
            {data.total} {data.total === 1 ? 'transaction' : 'transactions'}
          </p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Gig</th>
                  <th scope="col">Client</th>
                  <th scope="col">Freelancer</th>
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
                    <td>{payment.client?.name ?? 'Unknown'}</td>
                    <td>{payment.freelancer?.name ?? 'Unknown'}</td>
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

export default AdminTransactionsPage
