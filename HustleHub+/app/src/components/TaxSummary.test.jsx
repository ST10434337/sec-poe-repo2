import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SUMMARY_300K, SUMMARY_80K } from '../test/taxSummaries.js'
import TaxSummary from './TaxSummary.jsx'

// en-ZA puts a space (sometimes a special space) inside numbers, so \s matches either kind
describe('TaxSummary', () => {
  it('shows the estimated tax, what is kept, and both rates', () => {
    render(<TaxSummary summary={SUMMARY_300K} />)
    const boxes = within(screen.getByRole('region', { name: 'Tax estimate' }))

    expect(boxes.getByText(/^R\s?40\s?572$/)).toBeInTheDocument()
    expect(boxes.getByText(/^R\s?259\s?428$/)).toBeInTheDocument()
    expect(boxes.getByText('13.5%')).toBeInTheDocument()
    expect(boxes.getByText('26%')).toBeInTheDocument()
    expect(boxes.getByText('For the 2026/27 tax year')).toBeInTheDocument()
    expect(boxes.getByText(/^What you keep from R\s?300\s?000 paid$/)).toBeInTheDocument()
  })

  it('says no tax is due while paid income is under the threshold', () => {
    render(<TaxSummary summary={SUMMARY_80K} />)

    expect(screen.getByRole('status')).toHaveTextContent(/under the R\s?99\s?000 tax threshold, so no tax is due yet/)
    expect(screen.getByText('Nothing yet, until you pass the tax threshold')).toBeInTheDocument()
    // Both the effective rate and the set-aside rate are 0%
    expect(screen.getAllByText('0%')).toHaveLength(2)
  })

  it('has no threshold message once paid income is over the threshold', () => {
    render(<TaxSummary summary={SUMMARY_300K} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Of each new payment, for tax')).toBeInTheDocument()
  })
})
