import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SUMMARY_300K, SUMMARY_NONE } from '../test/taxSummaries.js'
import MonthlyIncomeChart from './MonthlyIncomeChart.jsx'

// SUMMARY_300K has 9 months (Mar to Nov) with income in Apr (R120 000), Jul (R100 000) and Oct (R80 000)
const renderChart = (summary = SUMMARY_300K) =>
  render(<MonthlyIncomeChart monthly={summary.monthly} taxYearLabel={summary.taxYear.label} />)

// en-ZA uses special spaces inside numbers; turn every kind of space into a normal one before comparing
const plain = (text) => text.replace(/\s/g, ' ')

describe('MonthlyIncomeChart', () => {
  it('draws a bar for each month with paid income and names every month', () => {
    const { container } = renderChart()

    expect(container.querySelectorAll('.chart-bar')).toHaveLength(3)
    for (const month of ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']) {
      expect(screen.getByText(month)).toBeInTheDocument()
    }
  })

  it('uses round steps on the side axis', () => {
    const { container } = renderChart()
    const axisLabels = [...container.querySelectorAll('text.chart-tick[text-anchor="end"]')].map((text) =>
      plain(text.textContent),
    )

    // The highest month is R120 000, so the axis goes 0 / 50k / 100k / 150k (0 in full, not "R 0k")
    expect(axisLabels).toEqual(['R 0', 'R 50k', 'R 100k', 'R 150k'])
  })

  it('writes the amount on the highest month only', () => {
    const { container } = renderChart()
    const values = container.querySelectorAll('.chart-value')

    expect(values).toHaveLength(1)
    expect(plain(values[0].textContent)).toBe('R 120 000')
  })

  it('gives each month a name with its amount and number of payments', () => {
    renderChart()

    expect(screen.getByRole('img', { name: /^Apr 2026: R\s?120\s?000 from 3 payments$/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /^Mar 2026: R\s?0 from 0 payments$/ })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /Total R\s?300\s?000\. Highest month: Apr 2026/ })).toBeInTheDocument()
  })

  it('shows a hover box with the amount and month, and hides it again', async () => {
    const user = userEvent.setup()
    const { container } = renderChart()
    const april = screen.getByRole('img', { name: /^Apr 2026/ })

    await user.hover(april)
    const tooltip = container.querySelector('.chart-tooltip')
    expect(plain(tooltip.textContent)).toBe('R 120 000Apr 2026 · 3 payments')

    await user.unhover(april)
    expect(container.querySelector('.chart-tooltip')).not.toBeInTheDocument()
  })

  it('shows the same box when a month is reached with the keyboard, skipping empty months', async () => {
    const user = userEvent.setup()
    const { container } = renderChart()

    // March has no income, so the first Tab stop is April
    await user.tab()
    expect(screen.getByRole('img', { name: /^Apr 2026/ })).toHaveFocus()
    expect(plain(container.querySelector('.chart-tooltip').textContent)).toContain('Apr 2026 · 3 payments')

    await user.tab()
    expect(screen.getByRole('img', { name: /^Jul 2026/ })).toHaveFocus()
  })

  it('has the same numbers as a table', async () => {
    const user = userEvent.setup()
    renderChart()

    await user.click(screen.getByText('Show as a table'))
    const table = screen.getByRole('table', { name: 'Paid income by month, 2026/27 tax year' })
    const rows = within(table).getAllByRole('row')

    // 1 heading row and 9 months
    expect(rows).toHaveLength(10)
    expect(plain(rows[2].textContent)).toBe('Apr 2026R 120 0003')
  })

  it('shows a message instead of a chart when nothing is paid yet', () => {
    const { container } = renderChart(SUMMARY_NONE)

    expect(screen.getByText(/No paid income yet in the 2026\/27 tax year/)).toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })
})
