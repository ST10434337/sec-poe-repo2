import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getFreelancerBookings, getMyBookings } from '../api/bookings.js'
import { useAuth } from '../auth/AuthContext.js'
import { useApi } from '../hooks/useApi.js'
import Alert from '../components/Alert.jsx'
import Pagination from '../components/Pagination.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { ROLES } from '../utils/constants.js'
import { formatDate, formatRand } from '../utils/format.js'

// One page for both roles: clients see bookings they made, freelancers see bookings on their gigs
// Actions (start, complete, cancel) are on the booking's own page
function BookingsPage() {
  const { user } = useAuth()
  const isClient = user.role === ROLES.CLIENT
  const [page, setPage] = useState(1)
  const { data, error, loading } = useApi(
    () => (isClient ? getMyBookings(page) : getFreelancerBookings(page)),
    [isClient, page],
  )

  return (
    <>
      <h1>{isClient ? 'My bookings' : 'Bookings on my gigs'}</h1>

      {loading && <p className="muted">Loading bookings…</p>}
      {!loading && error && <Alert type="error">{error}</Alert>}

      {!loading && data && data.bookings.length === 0 && (
        <p className="card">
          {isClient ? (
            <>
              You haven't booked any gigs yet. <Link to="/gigs">Browse gigs</Link>
            </>
          ) : (
            'No bookings yet. They will show here when clients book your gigs.'
          )}
        </p>
      )}

      {!loading && data && data.bookings.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Gig</th>
                  <th scope="col">{isClient ? 'Freelancer' : 'Client'}</th>
                  <th scope="col">Price</th>
                  <th scope="col">Status</th>
                  <th scope="col">Booked on</th>
                  <th scope="col">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking.gig?.title ?? 'Gig removed'}</td>
                    {/* The API only sends the other person's name, never their email */}
                    <td>{(isClient ? booking.freelancer?.name : booking.client?.name) ?? 'Unknown'}</td>
                    <td>{formatRand(booking.price)}</td>
                    <td>
                      <StatusBadge kind="booking" status={booking.status} />
                    </td>
                    <td>{formatDate(booking.createdAt)}</td>
                    <td>
                      <Link to={`/bookings/${booking._id}`} className="btn btn-secondary btn-small">
                        View<span className="sr-only">: {booking.gig?.title}</span>
                      </Link>
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

export default BookingsPage
