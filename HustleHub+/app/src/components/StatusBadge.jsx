import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '../utils/constants.js'

// The colour for each status; the same colour means the same thing everywhere
const TONES = {
  confirmed: 'info',
  in_progress: 'warning',
  pending: 'warning',
  completed: 'success',
  cancelled: 'muted',
  refunded: 'muted',
}

// A coloured pill that always shows the status as text, so it never relies on colour alone
//  kind: 'booking' or 'payment' (they use different words for the same status value)
function StatusBadge({ kind = 'booking', status }) {
  const labels = kind === 'payment' ? PAYMENT_STATUS_LABELS : BOOKING_STATUS_LABELS
  return <span className={`badge badge-${TONES[status] ?? 'muted'}`}>{labels[status] ?? status}</span>
}

export default StatusBadge
