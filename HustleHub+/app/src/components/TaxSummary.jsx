import Alert from './Alert.jsx'
import { formatPercent, formatRand } from '../utils/format.js'

// A freelancer's tax estimate from GET /api/transactions/tax, styled like IncomeSummary
// The "After tax" and "Estimated tax" boxes use the keep and tax colours of TaxSplitBar
//  Estimated tax  = tax on this tax year's paid income, after the rebate
//  After tax      = paid income minus the estimated tax
//  Effective rate = the share of all paid income that goes to tax
//  Set aside      = the marginal rate: how much of the next rand earned goes to tax
function TaxSummary({ summary }) {
  const { earned, estimate, taxYear } = summary
  const underThreshold = earned < estimate.threshold

  const boxes = [
    {
      label: 'Estimated tax',
      value: formatRand(estimate.tax),
      note: `For the ${taxYear.label} tax year`,
      tone: 'tax',
    },
    {
      label: 'After tax',
      value: formatRand(estimate.afterTax),
      note: `What you keep from ${formatRand(earned)} paid`,
      tone: 'keep',
    },
    {
      label: 'Effective rate',
      value: formatPercent(estimate.effectiveRate),
      note: 'Of your paid income goes to tax',
      tone: 'muted',
    },
    {
      label: 'Set aside',
      value: formatPercent(estimate.marginalRate),
      note: underThreshold ? 'Nothing yet, until you pass the tax threshold' : 'Of each new payment, for tax',
      tone: 'muted',
    },
  ]

  return (
    <>
      {underThreshold && (
        <Alert type="info">
          You&apos;re under the {formatRand(estimate.threshold)} tax threshold, so no tax is due yet.
        </Alert>
      )}
      <section className="stats" aria-label="Tax estimate">
        {boxes.map((box) => (
          <div key={box.label} className={`card stat stat-${box.tone}`}>
            <p className="stat-label">{box.label}</p>
            <p className="stat-value">{box.value}</p>
            <p className="muted">{box.note}</p>
          </div>
        ))}
      </section>
    </>
  )
}

export default TaxSummary
