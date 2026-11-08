import { useEffect, useState } from 'react'

// The width of an element in pixels, kept up to date when the window changes size ~> (MDN Web Docs, n.d.)
// The charts use it to draw in real pixels, so their text stays readable on phones
// `enabled` is false while the element isn't on the page yet (e.g. a chart showing its empty message)
// Without ResizeObserver (e.g. in tests) the fallback width is used
export function useElementWidth(ref, fallback, enabled = true) {
  const [width, setWidth] = useState(fallback)

  useEffect(() => {
    const element = ref.current
    if (!enabled || !element || typeof ResizeObserver === 'undefined') return undefined

    // ResizeObserver also reports the first size straight away
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, enabled])

  return width
}

// MDN Web Docs. n.d. ResizeObserver. [online]. Available at: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver. [Accessed 6 November 2026].
