import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SUMMARY_300K, SUMMARY_NONE } from '../test/taxSummaries.js'
import TaxWorking from './TaxWorking.jsx'

// en-ZA uses special spaces inside numbers; turn every kind of space into a normal one before comparing
const plain = (text) => text.replace(/\s/g, ' ')
const cells = (row) => within(row).getAllByRole('cell').map((cell) => plain(cell.textContent))
const totalRow = (row) => [plain(within(row).getByRole('rowheader').textContent), ...cells(row)]

describe('TaxWorking', () => {
  it('stays closed until the freelancer opens it', async () => {
    const user = userEvent.setup()
    render(<TaxWorking summary={SUMMARY_300K} />)
    const details = screen.getByText('How this is worked out').closest('details')

    expect(details).not.toHaveAttribute('open')
    await user.click(screen.getByText('How this is worked out'))
    expect(details).toHaveAttribute('open')
  })

  it('shows the tax on each band in SARS wording, then the rebate and the total', () => {
    render(<TaxWorking summary={SUMMARY_300K} />)
    const table = screen.getByRole('table', { name: 'Tax on each part of your paid income' })
    const rows = within(table).getAllByRole('row')

    // 1 heading row, 2 bands, 3 total rows
    expect(rows).toHaveLength(6)
    expect(cells(rows[1])).toEqual(['Up to R 245 100', '18%', 'R 245 100', 'R 44 118'])
    expect(cells(rows[2])).toEqual(['R 245 101 – R 383 100', '26%', 'R 54 900', 'R 14 274'])
    expect(totalRow(rows[3])).toEqual(['Tax before rebate', 'R 58 392'])
    expect(totalRow(rows[4])).toEqual(['Minus the primary rebate', '− R 17 820'])
    expect(totalRow(rows[5])).toEqual(['Estimated tax (never below R 0)', 'R 40 572'])
  })

  it('words the top band as "and above"', () => {
    const topBandOnly = {
      ...SUMMARY_300K,
      estimate: { ...SUMMARY_300K.estimate, bands: [{ from: 1878600, to: null, rate: 0.45, amount: 121400, tax: 54630 }] },
    }
    render(<TaxWorking summary={topBandOnly} />)
    const rows = within(screen.getByRole('table')).getAllByRole('row')

    expect(cells(rows[1])).toEqual(['R 1 878 601 and above', '45%', 'R 121 400', 'R 54 630'])
  })

  it('shows the tax year dates', () => {
    render(<TaxWorking summary={SUMMARY_300K} />)

    // en-ZA writes the day with two digits, e.g. "01 Mar 2026"
    expect(screen.getByText(/from 01 Mar 2026 to 28 Feb 2027/)).toBeInTheDocument()
  })

  it('explains there is nothing to work out when nothing is paid yet', () => {
    render(<TaxWorking summary={SUMMARY_NONE} />)

    expect(screen.getByText(/no paid income yet this tax year/)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('lists the assumptions and links to the SARS rates in a new tab', () => {
    render(<TaxWorking summary={SUMMARY_300K} />)
    const link = screen.getByRole('link', { name: 'SARS: rates of tax for individuals' })

    expect(screen.getByText('HustleHub+ is your only income.')).toBeInTheDocument()
    expect(screen.getByText('No business expenses are taken off.')).toBeInTheDocument()
    expect(link).toHaveAttribute('href', expect.stringContaining('sars.gov.za'))
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it("says when last year's SARS figures are used", () => {
    const newYear = { ...SUMMARY_300K, taxYear: { ...SUMMARY_300K.taxYear, year: 2028, label: '2027/28' } }
    render(<TaxWorking summary={newYear} />)

    expect(screen.getByText(/so last year's figures are used/)).toBeInTheDocument()
  })
})
