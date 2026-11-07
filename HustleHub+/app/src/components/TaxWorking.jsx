import { formatDate, formatPercent, formatRand } from '../utils/format.js'

const SARS_RATES_URL = 'https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/'

// A band in SARS's own wording ~> (SARS, 2026)
// e.g. "Up to R 245 100", "R 245 101 – R 383 100", "R 1 878 601 and above"
const bandLabel = ({ from, to }) => {
  if (to === null) return `${formatRand(from + 1)} and above`
  if (from === 0) return `Up to ${formatRand(to)}`
  return `${formatRand(from + 1)} – ${formatRand(to)}`
}

// "How this is worked out": the tax estimate step by step, so the freelancer can check it
// <details> keeps it closed until they ask for it ~> (MDN Web Docs, n.d.)
function TaxWorking({ summary }) {
  const { estimate, taxYear } = summary

  return (
    <details className="card tax-working">
      <summary>How this is worked out</summary>

      <p>
        Your paid income from {formatDate(taxYear.start)} to {formatDate(taxYear.end)} is split into SARS&apos;s tax
        bands for the {taxYear.label} tax year. Each part is taxed at its band&apos;s rate. Then the primary rebate is
        taken off.
      </p>

      {taxYear.tableYear !== taxYear.year && (
        <p className="muted">
          SARS&apos;s figures for this tax year aren&apos;t in the app yet, so last year&apos;s figures are used.
        </p>
      )}

      {estimate.bands.length === 0 ? (
        <p>You have no paid income yet this tax year, so there is no tax to work out.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Tax on each part of your paid income</caption>
            <thead>
              <tr>
                <th scope="col">Income band</th>
                <th scope="col">Rate</th>
                <th scope="col">Your income in this band</th>
                <th scope="col">Tax</th>
              </tr>
            </thead>
            <tbody>
              {estimate.bands.map((band) => (
                <tr key={band.from}>
                  <td>{bandLabel(band)}</td>
                  <td>{formatPercent(band.rate)}</td>
                  <td>{formatRand(band.amount)}</td>
                  <td>{formatRand(band.tax)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={3}>Tax before rebate</th>
                <td>{formatRand(estimate.taxBeforeRebate)}</td>
              </tr>
              <tr>
                <th scope="row" colSpan={3}>Minus the primary rebate</th>
                <td>− {formatRand(estimate.rebate)}</td>
              </tr>
              <tr>
                <th scope="row" colSpan={3}>Estimated tax (never below R 0)</th>
                <td>
                  <strong>{formatRand(estimate.tax)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <h3>What this estimate assumes</h3>
      <ul>
        <li>HustleHub+ is your only income.</li>
        <li>No business expenses are taken off.</li>
        <li>You are under 65, so only the primary rebate applies.</li>
        <li>No medical tax credits or other deductions.</li>
      </ul>

      <p className="muted">
        This is an estimate, not tax advice. Rates from{' '}
        <a href={SARS_RATES_URL} target="_blank" rel="noopener noreferrer">
          SARS: rates of tax for individuals
        </a>
        .
      </p>
    </details>
  )
}

export default TaxWorking

// MDN Web Docs. n.d. <details>: The Details disclosure element. [online]. Available at: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details. [Accessed 6 November 2026].
// South African Revenue Service (SARS). 2026. Rates of tax for individuals. [online]. Available at: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/. [Accessed 6 November 2026].
