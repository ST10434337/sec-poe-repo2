// Pretend replies from GET /api/transactions/tax, for component tests
// The numbers are the API's real results for these incomes (SARS 2027 tax year)

const TAX_YEAR = { year: 2027, label: '2026/27', start: '2026-03-01', end: '2027-02-28', tableYear: 2027 }

// Every estimate has the same rebate and threshold
const estimate = (fields) => ({ rebate: 17820, threshold: 99000, ...fields })

// Paid income per month from March, e.g. months({ '2026-04': [120000, 3] }) ~> up to November
const MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
const months = (paid) =>
  MONTHS.map((label, i) => {
    const month = `2026-${String(i + 3).padStart(2, '0')}`
    const [earned, count] = paid[month] ?? [0, 0]
    return { month, label, earned, count }
  })

// R300 000 paid: reaches the second band, R40 572 tax
export const SUMMARY_300K = {
  currency: 'ZAR',
  taxYear: TAX_YEAR,
  earned: 300000,
  pending: 20000,
  estimate: estimate({
    taxableIncome: 300000,
    taxBeforeRebate: 58392,
    tax: 40572,
    afterTax: 259428,
    effectiveRate: 0.1352,
    marginalRate: 0.26,
    bands: [
      { from: 0, to: 245100, rate: 0.18, amount: 245100, tax: 44118 },
      { from: 245100, to: 383100, rate: 0.26, amount: 54900, tax: 14274 },
    ],
  }),
  ifPendingPaid: { taxableIncome: 320000, tax: 45772, extraTax: 5200 },
  monthly: months({ '2026-04': [120000, 3], '2026-07': [100000, 2], '2026-10': [80000, 2] }),
}

// R80 000 paid: under the R99 000 threshold, so no tax
export const SUMMARY_80K = {
  currency: 'ZAR',
  taxYear: TAX_YEAR,
  earned: 80000,
  pending: 0,
  estimate: estimate({
    taxableIncome: 80000,
    taxBeforeRebate: 14400,
    tax: 0,
    afterTax: 80000,
    effectiveRate: 0,
    marginalRate: 0,
    bands: [{ from: 0, to: 245100, rate: 0.18, amount: 80000, tax: 14400 }],
  }),
  ifPendingPaid: { taxableIncome: 80000, tax: 0, extraTax: 0 },
  monthly: months({ '2026-09': [80000, 4] }),
}

// Nothing paid yet this tax year
export const SUMMARY_NONE = {
  currency: 'ZAR',
  taxYear: TAX_YEAR,
  earned: 0,
  pending: 0,
  estimate: estimate({
    taxableIncome: 0,
    taxBeforeRebate: 0,
    tax: 0,
    afterTax: 0,
    effectiveRate: 0,
    marginalRate: 0,
    bands: [],
  }),
  ifPendingPaid: { taxableIncome: 0, tax: 0, extraTax: 0 },
  monthly: months({}),
}
