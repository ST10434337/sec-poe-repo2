import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { cancelBooking, getBooking, updateBookingStatus } from '../api/bookings.js'
import { useAuth } from '../auth/AuthContext.js'
import { useApi } from '../hooks/useApi.js'
import Alert from '../components/Alert.jsx'
import FormField from '../components/FormField.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { ROLES } from '../utils/constants.js'
import { formatDate, formatRand } from '../utils/format.js'

// The freelancer moves a booking one step at a time: confirmed -> in_progress -> completed
const NEXT_STEP = {
  confirmed: { status: 'in_progress', label: 'Start work', done: 'Work started.' },
  in_progress: {
    status: 'completed',
    label: 'Mark as completed',
    done: 'Booking completed. The payment was released to you.',
  },
}

// One booking and its simulated payment, for its client, its freelancer or an admin
// The API returns 404 for a booking that is not yours, the same as a missing one
function BookingDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, error, errorStatus, loading, reload } = useApi(() => getBooking(id), [id])
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [reason, setReason] = useState('')

  const backTo = user.role === ROLES.ADMIN ? '/admin/transactions' : '/bookings'
  const backLink = (
    <p>
      <Link to={backTo}>← Back to {user.role === ROLES.ADMIN ? 'all transactions' : 'bookings'}</Link>
    </p>
  )

  // Keep showing the booking while it reloads after an action, so the page does not flash
  if (loading && data?.booking?._id !== id) return <p className="muted">Loading booking…</p>

  if (error) {
    // 400 = not a valid id, 404 = missing or not yours
    const notFound = errorStatus === 400 || errorStatus === 404
    return (
      <>
        {backLink}
        <h1>{notFound ? 'Booking not found' : 'Could not load this booking'}</h1>
        <Alert type="error">{notFound ? 'This booking does not exist, or it is not one of yours.' : error}</Alert>
      </>
    )
  }

  const { booking, transaction } = data
  const price = formatRand(booking.price)

  // Actions only show for the person they belong to; the API checks this again
  const isMyGig = user.role === ROLES.FREELANCER && booking.freelancer?._id === user.id
  const isMyBooking = user.role === ROLES.CLIENT && booking.client?._id === user.id
  const nextStep = isMyGig ? NEXT_STEP[booking.status] : null
  const canCancel = isMyBooking && booking.status === 'confirmed'

  // Runs an action, then loads the booking again (the action's reply does not include names)
  async function runAction(action, doneMessage) {
    setBusy(true)
    setActionError('')
    try {
      await action()
      navigate(`/bookings/${booking._id}`, { replace: true, state: { message: doneMessage, type: 'success' } })
    } catch (err) {
      // 409: someone else changed it first; 400: it is no longer in the status this page showed
      if (err.status === 409) setActionError("This booking was changed somewhere else. We've refreshed it, so please check it and try again.")
      else if (err.status === 400) setActionError(`${err.message}. We've refreshed the booking.`)
      else setActionError(err.message)
    } finally {
      setBusy(false)
      reload()
    }
  }

  function handleNextStep() {
    if (nextStep.status === 'completed') {
      const sure = window.confirm(`Mark this booking as completed?\n\nThis releases the payment of ${price} to you.`)
      if (!sure) return
    }
    runAction(() => updateBookingStatus(booking._id, nextStep.status), nextStep.done)
  }

  function handleCancel(e) {
    e.preventDefault()
    const sure = window.confirm(`Cancel this booking?\n\nYour payment of ${price} will be refunded.`)
    if (!sure) return
    runAction(() => cancelBooking(booking._id, reason), 'Booking cancelled. Your payment was refunded.')
  }

  return (
    <>
      {backLink}
      <div className="page-header">
        <h1>Booking</h1>
        <StatusBadge kind="booking" status={booking.status} />
      </div>

      <Alert type="error">{actionError}</Alert>

      <dl className="card details">
        <dt>Gig</dt>
        <dd>{booking.gig?.title ?? 'Gig removed'}</dd>
        <dt>Client</dt>
        <dd>{booking.client?.name ?? 'Unknown'}</dd>
        <dt>Freelancer</dt>
        <dd>{booking.freelancer?.name ?? 'Unknown'}</dd>
        <dt>Price</dt>
        <dd>{price}</dd>
        <dt>Booked on</dt>
        <dd>{formatDate(booking.createdAt)}</dd>
        {booking.cancellationReason && (
          <>
            <dt>Cancel reason</dt>
            <dd className="pre-line">{booking.cancellationReason}</dd>
          </>
        )}
      </dl>

      {transaction && (
        <section className="card">
          <h2>Payment</h2>
          <dl className="details">
            <dt>Reference</dt>
            <dd>{transaction.reference}</dd>
            <dt>Amount</dt>
            <dd>{formatRand(transaction.amount)}</dd>
            <dt>Status</dt>
            <dd>
              <StatusBadge kind="payment" status={transaction.status} />
            </dd>
            <dt>Method</dt>
            <dd>Simulated payment (no real money is moved)</dd>
          </dl>
        </section>
      )}

      {nextStep && (
        <section className="card">
          <h2>Next step</h2>
          <p>
            {booking.status === 'confirmed'
              ? 'Start the work when you are ready. The client can no longer cancel after this.'
              : 'Mark the booking as completed when the work is done. This releases the payment to you.'}
          </p>
          <button type="button" className="btn" onClick={handleNextStep} disabled={busy}>
            {busy ? 'Saving…' : nextStep.label}
          </button>
        </section>
      )}

      {canCancel && (
        <form className="card" onSubmit={handleCancel} noValidate>
          <h2>Cancel booking</h2>
          <p>You can cancel until the freelancer starts the work. Your payment will be refunded.</p>
          <FormField
            id="reason"
            label="Reason (optional)"
            as="textarea"
            rows={3}
            maxLength={500}
            counter
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button type="submit" className="btn btn-danger" disabled={busy}>
            {busy ? 'Cancelling…' : 'Cancel booking'}
          </button>
        </form>
      )}

      {isMyBooking && booking.status === 'in_progress' && (
        <p className="muted">The freelancer is working on this, so it can no longer be cancelled.</p>
      )}
      {booking.status === 'completed' && (
        <p className="muted">This booking is completed. The payment was released to the freelancer.</p>
      )}
      {booking.status === 'cancelled' && (
        <p className="muted">This booking was cancelled. The payment was refunded to the client.</p>
      )}
    </>
  )
}

export default BookingDetailPage
