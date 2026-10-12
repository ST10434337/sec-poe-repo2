import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import IncomeSummary from './IncomeSummary.jsx'

describe('IncomeSummary', () => {
  it('shows earned, pending and refunded totals in rand', () => {
    render(<IncomeSummary income={{ currency: 'ZAR', earned: 1500, pending: 500, refunded: 0, completedCount: 2 }} />)

    // en-ZA puts a space (sometimes a special space) inside numbers, so \s matches either kind
    expect(screen.getByText(/R\s?1\s?500/)).toBeInTheDocument()
    expect(screen.getByText(/R\s?500$/)).toBeInTheDocument()
    expect(screen.getByText(/R\s?0$/)).toBeInTheDocument()
    expect(screen.getByText('2 completed jobs')).toBeInTheDocument()
  })

  it('says "job" for one completed job', () => {
    render(<IncomeSummary income={{ currency: 'ZAR', earned: 750, pending: 0, refunded: 0, completedCount: 1 }} />)
    expect(screen.getByText('1 completed job')).toBeInTheDocument()
  })
})
