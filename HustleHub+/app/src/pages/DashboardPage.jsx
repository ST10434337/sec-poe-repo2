import { Link } from 'react-router-dom'
import { getIncome, getTaxSummary } from '../api/transactions.js'
import { useApi } from '../hooks/useApi.js'
import Alert from '../components/Alert.jsx'
import IncomeSummary from '../components/IncomeSummary.jsx'
import MonthlyIncomeChart from '../components/MonthlyIncomeChart.jsx'
import TaxSplitBar from '../components/TaxSplitBar.jsx'
import TaxSummary from '../components/TaxSummary.jsx'
import TaxWorking from '../components/TaxWorking.jsx'
import { formatDate, formatRand } from '../utils/format.js'

// What the freelancer's pending work would add to their tax, if it's paid this tax year
function PendingNote({ summary }) {
  const { pending, ifPendingPaid } = summary
  if (pending === 0) return null

  return (
    <p>
      You have {formatRand(pending)} of work that isn&apos;t paid yet. If it&apos;s paid this tax year,{' '}
      {ifPendingPaid.extraTax > 0
        ? `your estimated tax goes up by ${formatRand(ifPendingPaid.extraTax)} to ${formatRand(ifPendingPaid.tax)}.`
        : `your estimated tax stays at ${formatRand(ifPendingPaid.tax)}.`}
    </p>
  )
}

// A freelancer's money at a glance: all-time income, this tax year's estimated tax, and paid income per month
// The two requests run at the same time, and each part shows its own loading or error message
// The API works everything out; this page only shows it
function DashboardPage() {
  const income = useApi(() => getIncome(), [])
  const tax = useApi(() => getTaxSummary(), [])
  const summary = tax.data

  return (
    <>
      <h1>Dashboard</h1>

      <section className="dashboard-section" aria-labelledby="income-heading">
        <h2 id="income-heading">All-time income</h2>
        {income.loading && <p className="muted">Loading income…</p>}
        {!income.loading && income.error && <Alert type="error">{income.error}</Alert>}
        {!income.loading && income.data && <IncomeSummary income={income.data} />}
        <p>
          <Link to="/transactions">See every payment</Link>
        </p>
      </section>

      {tax.loading && <p className="muted dashboard-section">Working out your tax…</p>}
      {!tax.loading && tax.error && (
        <div className="dashboard-section">
          <Alert type="error">{tax.error}</Alert>
        </div>
      )}

      {!tax.loading && summary && (
        <>
          <section className="dashboard-section" aria-labelledby="tax-heading">
            <h2 id="tax-heading">Estimated tax for {summary.taxYear.label}</h2>
            <p className="muted">
              Based on your paid income from {formatDate(summary.taxYear.start)} to {formatDate(summary.taxYear.end)}.
            </p>
            <TaxSummary summary={summary} />
            <TaxSplitBar summary={summary} />
            <PendingNote summary={summary} />
            <TaxWorking summary={summary} />
          </section>

          <section className="dashboard-section" aria-labelledby="monthly-heading">
            <h2 id="monthly-heading">Paid income by month</h2>
            <MonthlyIncomeChart monthly={summary.monthly} taxYearLabel={summary.taxYear.label} />
          </section>

          <p className="muted dashboard-section">
            The tax figures are an estimate to help you plan, not tax advice. Check with SARS or a tax practitioner
            before you file.
          </p>
        </>
      )}
    </>
  )
}

export default DashboardPage
