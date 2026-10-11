// Money and date formatting, so every page shows them the same way

// Prices are whole rand, so no cents are shown, e.g. "R 1 500" ~> (MDN Web Docs, n.d.a)
const rand = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export const formatRand = (amount) => rand.format(amount)

// e.g. "12 Oct 2026" ~> (MDN Web Docs, n.d.b)
export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })

// MDN Web Docs (n.d.a) Intl.NumberFormat. Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat (Accessed: 12 October 2026).
// MDN Web Docs (n.d.b) Date.prototype.toLocaleDateString(). Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString (Accessed: 12 October 2026).
