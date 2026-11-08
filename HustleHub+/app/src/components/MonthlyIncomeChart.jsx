import { useId, useRef, useState } from 'react'
import { useElementWidth } from '../hooks/useElementWidth.js'
import { formatRand } from '../utils/format.js'

// Paid income per month in the tax year, as a column chart
// Hand-made SVG: no chart library to install, patch or scan ~> (MDN Web Docs, n.d.)
// Every size and position is an SVG attribute, so there are no inline styles and the CSP stays strict
// Drawn in real pixels for the space it has, so the text stays readable on phones

const HEIGHT = 240 // The whole chart, including the month labels
const MARGIN = { top: 28, right: 8, bottom: 28, left: 56 }
const MAX_BAR_WIDTH = 24 // Thin bars; the rest of each month's space stays empty
const CORNER = 4 // Rounded top corners, square at the bottom
const TIP = { width: 170, height: 60 } // Space for the hover box above a bar

// A round step for the side axis, giving at most 4 steps above 0, e.g. 0 / 50k / 100k / 150k
const niceStep = (highest) => {
  const power = 10 ** Math.floor(Math.log10(highest / 4))
  return [1, 2, 2.5, 5, 10].map((m) => m * power).find((step) => highest / step <= 4)
}

// A bar with rounded top corners, as an SVG path
const barPath = (x, y, width, height) => {
  const r = Math.min(CORNER, width / 2, height)
  return `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`
}

// e.g. "Apr 2026"
const monthName = (row) => `${row.label} ${row.month.slice(0, 4)}`
const paymentsText = (count) => (count === 1 ? '1 payment' : `${count} payments`)

function MonthlyIncomeChart({ monthly, taxYearLabel }) {
  const plotRef = useRef(null)
  const [active, setActive] = useState(null)
  const titleId = useId()
  const hasIncome = monthly.some((row) => row.earned > 0)
  const width = useElementWidth(plotRef, 640, hasIncome)

  if (!hasIncome) {
    return (
      <p className="card muted">
        No paid income yet in the {taxYearLabel} tax year. Each month fills in here as your bookings are completed.
      </p>
    )
  }

  const highest = Math.max(...monthly.map((row) => row.earned))
  const highestIndex = monthly.findIndex((row) => row.earned === highest)
  const total = monthly.reduce((sum, row) => sum + row.earned, 0)

  // Side axis: round steps from 0 up past the highest month
  const step = niceStep(highest)
  const top = Math.ceil(highest / step) * step
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
  // Under R10 000 the axis shows full amounts; from there it shortens them, e.g. "R 50k" (0 stays "R 0")
  const tickLabel = (value) => (top >= 10000 && value > 0 ? `R ${value / 1000}k` : formatRand(value))

  // Turn amounts and months into pixel positions
  const plotWidth = Math.max(width - MARGIN.left - MARGIN.right, 0)
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const slot = plotWidth / monthly.length
  const barWidth = Math.min(MAX_BAR_WIDTH, slot * 0.6)
  const y = (value) => MARGIN.top + plotHeight - (value / top) * plotHeight
  const slotX = (i) => MARGIN.left + slot * i
  const centreX = (i) => slotX(i) + slot / 2
  // On narrow screens with many months, name every other month so the names don't touch
  const labelEvery = slot < 26 ? 2 : 1
  // Keep the highest month's amount inside the chart near the edges
  const valueX = Math.min(Math.max(centreX(highestIndex), MARGIN.left + 36), width - MARGIN.right - 36)

  const summaryText = `Paid income by month for the ${taxYearLabel} tax year. Total ${formatRand(total)}. Highest month: ${monthName(monthly[highestIndex])}, ${formatRand(highest)}.`
  const activeRow = active === null ? null : monthly[active]

  return (
    <div className="chart">
      <div className="chart-plot" ref={plotRef}>
        <svg width={width} height={HEIGHT} role="group" aria-labelledby={titleId}>
          <title id={titleId}>{summaryText}</title>

          {/* Gridlines, side axis and month names; screen readers get the summary and each month's name instead */}
          <g aria-hidden="true">
            {ticks.map((tick) => {
              const lineY = Math.round(y(tick)) + 0.5 // Half a pixel keeps a 1px line sharp
              return (
                <g key={tick}>
                  <line className={tick === 0 ? 'chart-axis' : 'chart-grid'} x1={MARGIN.left} x2={width - MARGIN.right} y1={lineY} y2={lineY} />
                  <text className="chart-tick" x={MARGIN.left - 8} y={lineY} dy="0.32em" textAnchor="end">
                    {tickLabel(tick)}
                  </text>
                </g>
              )
            })}
            {monthly.map((row, i) =>
              i % labelEvery === 0 ? (
                <text key={row.month} className="chart-tick" x={centreX(i)} y={HEIGHT - 8} textAnchor="middle">
                  {row.label}
                </text>
              ) : null,
            )}
          </g>

          {/* One bar per month with paid income; a month with none draws nothing */}
          <g aria-hidden="true">
            {monthly.map((row, i) =>
              row.earned > 0 ? (
                <path
                  key={row.month}
                  className={`chart-bar${active === i ? ' is-active' : ''}`}
                  d={barPath(centreX(i) - barWidth / 2, y(row.earned), barWidth, y(0) - y(row.earned))}
                />
              ) : null,
            )}
            {/* Only the highest month gets its amount written on the chart */}
            <text className="chart-value" x={valueX} y={y(highest) - 8} textAnchor="middle">
              {formatRand(highest)}
            </text>
          </g>

          {/* Hover and focus areas: each covers its month's whole column, so it is easy to hit */}
          {monthly.map((row, i) => (
            <rect
              key={row.month}
              className="chart-hit"
              x={slotX(i)}
              y={MARGIN.top}
              width={slot}
              height={plotHeight}
              role="img"
              aria-label={`${monthName(row)}: ${formatRand(row.earned)} from ${paymentsText(row.count)}`}
              tabIndex={row.earned > 0 ? 0 : -1}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            />
          ))}

          {/* Hover box above the bar: the amount leads, the month follows
              It repeats the month's name, so screen readers skip it */}
          {activeRow && (
            <foreignObject
              className="chart-tooltip-area"
              x={Math.min(Math.max(centreX(active) - TIP.width / 2, 0), width - TIP.width)}
              y={Math.max(y(activeRow.earned) - TIP.height - 6, 0)}
              width={TIP.width}
              height={TIP.height}
              aria-hidden="true"
            >
              <div className="chart-tooltip-wrap">
                <div className="chart-tooltip">
                  <strong>{formatRand(activeRow.earned)}</strong>
                  <span>
                    {monthName(activeRow)} · {paymentsText(activeRow.count)}
                  </span>
                </div>
              </div>
            </foreignObject>
          )}
        </svg>
      </div>

      {/* The same numbers as a table, for anyone who can't hover or prefers to read them */}
      <details className="chart-table">
        <summary>Show as a table</summary>
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Paid income by month, {taxYearLabel} tax year</caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Paid income</th>
                <th scope="col">Payments</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((row) => (
                <tr key={row.month}>
                  <th scope="row">{monthName(row)}</th>
                  <td>{formatRand(row.earned)}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

export default MonthlyIncomeChart

// MDN Web Docs. n.d. SVG: Scalable Vector Graphics. [online]. Available at: https://developer.mozilla.org/en-US/docs/Web/SVG. [Accessed 6 November 2026].
