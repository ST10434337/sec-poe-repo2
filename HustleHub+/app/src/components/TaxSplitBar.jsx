import { useRef } from 'react'
import { useElementWidth } from '../hooks/useElementWidth.js'
import { formatPercent, formatRand } from '../utils/format.js'

const HEIGHT = 8 // A thin bar with fully rounded ends
const GAP = 2 // White space between the two parts

// How this tax year's paid income splits into what the freelancer keeps and the estimated tax
// A thin bar with no numbers on it: it sits under the tax boxes, which already show the amounts
// Blue = keep and orange = tax, the same colours as the tops of the "After tax" and "Estimated tax" boxes
// Drawn as SVG in real pixels (no inline styles), like MonthlyIncomeChart
function TaxSplitBar({ summary }) {
  const barRef = useRef(null)
  const { earned, estimate } = summary
  const width = useElementWidth(barRef, 320, earned > 0)

  if (earned === 0) return null

  const parts = [
    { name: 'Keep', amount: estimate.afterTax, kind: 'keep' },
    { name: 'Tax', amount: estimate.tax, kind: 'tax' },
  ]
  const share = (amount) => formatPercent(amount / earned)
  const description =
    `Of ${formatRand(earned)} paid, you keep ${formatRand(estimate.afterTax)} (${share(estimate.afterTax)})` +
    ` and ${formatRand(estimate.tax)} (${share(estimate.tax)}) goes to tax`

  // Each part's length follows its amount; a part of R 0 draws nothing
  const shown = parts.filter((part) => part.amount > 0)
  const room = Math.max(width - GAP * (shown.length - 1), 0)
  let x = 0
  const blocks = shown.map((part) => {
    const block = { ...part, x, width: room * (part.amount / earned) }
    x += block.width + GAP
    return block
  })

  return (
    <figure className="split">
      <div className="split-bar" ref={barRef}>
        <svg width={width} height={HEIGHT} role="img" aria-label={description}>
          {blocks.map((block) => (
            <rect
              key={block.name}
              className={`split-${block.kind}`}
              x={block.x}
              y={0}
              width={block.width}
              height={HEIGHT}
              rx={HEIGHT / 2}
            />
          ))}
        </svg>
      </div>
      <figcaption className="split-legend">
        {parts.map((part) => (
          <span key={part.name} className="split-key">
            <span className={`swatch swatch-${part.kind}`} aria-hidden="true" />
            {part.name}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}

export default TaxSplitBar
