import { formatRand } from '../utils/format.js'

// A freelancer's totals from GET /api/transactions/income
//  earned   = completed bookings (payment released to the freelancer)
//  pending  = bookings that are confirmed or in progress
//  refunded = cancelled bookings (the money went back to the client)
function IncomeSummary({ income }) {
  const jobs = income.completedCount
  const boxes = [
    { label: 'Earned', value: income.earned, note: `${jobs} completed ${jobs === 1 ? 'job' : 'jobs'}`, tone: 'success' },
    { label: 'Pending', value: income.pending, note: 'Paid out when the work is completed', tone: 'warning' },
    { label: 'Refunded', value: income.refunded, note: 'From cancelled bookings', tone: 'muted' },
  ]

  return (
    <section className="stats" aria-label="Income summary">
      {boxes.map((box) => (
        <div key={box.label} className={`card stat stat-${box.tone}`}>
          <p className="stat-label">{box.label}</p>
          <p className="stat-value">{formatRand(box.value)}</p>
          <p className="muted">{box.note}</p>
        </div>
      ))}
    </section>
  )
}

export default IncomeSummary
