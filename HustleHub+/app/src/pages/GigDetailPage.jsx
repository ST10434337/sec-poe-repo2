import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { createBooking } from '../api/bookings.js'
import { getGig } from '../api/gigs.js'
import { useAuth } from '../auth/AuthContext.js'
import { useApi } from '../hooks/useApi.js'
import Alert from '../components/Alert.jsx'
import { ROLES, categoryLabel } from '../utils/constants.js'
import { formatRand } from '../utils/format.js'

// The Book button for clients; booking also creates the simulated payment
function BookBox({ gig }) {
  const navigate = useNavigate()
  const [booking, setBooking] = useState(false)
  const [bookError, setBookError] = useState('')
  // Blocks a second click straight away, before the disabled button has re-drawn, so a gig is booked once
  const busy = useRef(false)
  const price = formatRand(gig.price)

  async function handleBook() {
    if (busy.current) return
    const sure = window.confirm(
      `Book "${gig.title}" for ${price}?\n\nA simulated payment of ${price} is held until the freelancer completes the work.`,
    )
    if (!sure) return

    busy.current = true
    setBooking(true)
    setBookError('')
    try {
      // Only the gig id is sent; the API sets the client, freelancer and price
      const { booking: created, transaction } = await createBooking(gig._id)
      navigate(`/bookings/${created._id}`, {
        state: {
          message: `Booked! Your payment reference is ${transaction.reference}. The payment stays pending until the work is completed.`,
          type: 'success',
        },
      })
    } catch (err) {
      setBookError(err.message)
      setBooking(false)
      busy.current = false
    }
  }

  return (
    <>
      <Alert type="error">{bookError}</Alert>
      <button type="button" className="btn" onClick={handleBook} disabled={booking}>
        {booking ? 'Booking…' : `Book this gig for ${price}`}
      </button>
    </>
  )
}

// The box under the gig: what this visitor can do with it
// Later will ~> Remove gig for admins
function GigActions({ gig, user, location }) {
  if (!user) {
    return (
      <>
        <p>Log in as a client to book this gig.</p>
        {/* After logging in, the login page sends the user back to this gig */}
        <Link to="/login" state={{ from: location }} className="btn">Log in to book</Link>
        <p className="muted">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </>
    )
  }

  if (user.role === ROLES.CLIENT) return <BookBox gig={gig} />
  if (user.role === ROLES.FREELANCER) return <p className="muted">Freelancer accounts can't book gigs.</p>
  return <p className="muted">Admin accounts can't book gigs.</p>
}

// Public page for one active gig; anyone can view it, only clients can book it
function GigDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const location = useLocation()
  const { data, error, errorStatus, loading } = useApi(() => getGig(id), [id])

  // Back to the same search results the user came from
  const backTo = location.state?.backTo ?? '/gigs'
  const backLink = (
    <p>
      <Link to={backTo}>← Back to gigs</Link>
    </p>
  )

  if (loading) return <p className="muted">Loading gig…</p>

  if (error) {
    // 400 = not a valid id, 404 = missing or deleted; both mean there is no gig to show
    const notFound = errorStatus === 400 || errorStatus === 404
    return (
      <>
        {backLink}
        <h1>{notFound ? 'Gig not found' : 'Could not load this gig'}</h1>
        <Alert type="error">
          {notFound ? 'This gig does not exist or has been removed.' : error}
        </Alert>
      </>
    )
  }

  const { gig } = data

  return (
    <>
      {backLink}
      <article className="card">
        <p className="gig-category">{categoryLabel(gig.category)}</p>
        <h1>{gig.title}</h1>
        <p className="muted">by {gig.freelancer?.name ?? 'Unknown freelancer'}</p>
        <p className="gig-price">{formatRand(gig.price)}</p>
        <h2>About this gig</h2>
        {/* pre-line keeps the freelancer's line breaks without using HTML */}
        <p className="pre-line">{gig.description}</p>
      </article>

      <section className="card" aria-label="Book this gig">
        <GigActions gig={gig} user={user} location={location} />
      </section>
    </>
  )
}

export default GigDetailPage
