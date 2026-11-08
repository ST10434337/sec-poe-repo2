import { describe, expect, it } from 'vitest'
import { formatPercent } from './format.js'

describe('formatPercent', () => {
  it('turns a fraction into a percentage with at most one decimal, using a dot', () => {
    expect(formatPercent(0.0612)).toBe('6.1%')
    expect(formatPercent(0.1073)).toBe('10.7%')
    expect(formatPercent(0.3516)).toBe('35.2%')
  })

  it('drops ".0" from whole percentages', () => {
    expect(formatPercent(0.18)).toBe('18%')
    expect(formatPercent(0.45)).toBe('45%')
    expect(formatPercent(0)).toBe('0%')
  })
})
