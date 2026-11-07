import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SUMMARY_300K, SUMMARY_80K, SUMMARY_NONE } from '../test/taxSummaries.js'
import TaxSplitBar from './TaxSplitBar.jsx'

// Tests draw at the fallback width of 320px: 318px for the parts plus a 2px gap
describe('TaxSplitBar', () => {
  it('describes the split for screen readers', () => {
    render(<TaxSplitBar summary={SUMMARY_300K} />)

    expect(
      screen.getByRole('img', {
        name: /^Of R\s?300\s?000 paid, you keep R\s?259\s?428 \(86\.5%\) and R\s?40\s?572 \(13\.5%\) goes to tax$/,
      }),
    ).toBeInTheDocument()
  })

  it('sizes each part by its amount, with a gap between them', () => {
    const { container } = render(<TaxSplitBar summary={SUMMARY_300K} />)
    const [keep, tax] = container.querySelectorAll('rect')

    expect(keep).toHaveClass('split-keep')
    expect(tax).toHaveClass('split-tax')
    expect(Number(keep.getAttribute('width'))).toBeCloseTo(318 * (259428 / 300000), 5)
    expect(Number(tax.getAttribute('x'))).toBeCloseTo(Number(keep.getAttribute('width')) + 2, 5)
  })

  it('draws only the keep part when there is no tax', () => {
    const { container } = render(<TaxSplitBar summary={SUMMARY_80K} />)
    const rects = container.querySelectorAll('rect')

    expect(rects).toHaveLength(1)
    expect(rects[0]).toHaveAttribute('width', '320')
    expect(screen.getByRole('img', { name: /R\s?0 \(0%\) goes to tax$/ })).toBeInTheDocument()
  })

  it('names both parts in a legend', () => {
    render(<TaxSplitBar summary={SUMMARY_300K} />)

    expect(screen.getByText('Keep')).toBeInTheDocument()
    expect(screen.getByText('Tax')).toBeInTheDocument()
  })

  it('shows nothing when nothing is paid yet', () => {
    const { container } = render(<TaxSplitBar summary={SUMMARY_NONE} />)

    expect(container).toBeEmptyDOMElement()
  })
})
