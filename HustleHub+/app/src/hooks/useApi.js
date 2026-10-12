import { useEffect, useState } from 'react'

// Loads data for a page, so every page handles loading and errors the same way
//  load: a function that returns an API promise, e.g. () => getGig(id)
//  deps: the values that should trigger a new load, e.g. [id] or [q, category, page]
// Returns { data, error, loading, reload, setData }
export function useApi(load, deps) {
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState({ key: null, data: null, error: '' })

  // A new key (new deps, or reload) means new data is needed
  const key = JSON.stringify([...deps, version])

  useEffect(() => {
    // Stops an old, slow reply from overwriting a newer one ~> (React, n.d.)
    let ignore = false
    load()
      .then((data) => {
        if (!ignore) setResult({ key, data, error: '' })
      })
      .catch((err) => {
        if (!ignore) setResult({ key, data: null, error: err.message })
      })
    return () => {
      ignore = true
    }
    // key already covers deps; load is a new function on every render, so it is left out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return {
    data: result.data,
    error: result.error,
    // Still loading until the latest result matches the latest key
    loading: result.key !== key,
    // Load the same data again, for example after an action changed it
    reload: () => setVersion((v) => v + 1),
    // Change the data in place, for example one row after an admin action
    setData: (update) =>
      setResult((r) => ({ ...r, data: typeof update === 'function' ? update(r.data) : update })),
  }
}

// React (n.d.) Synchronizing with Effects: Fetching data. Available at: https://react.dev/learn/synchronizing-with-effects#fetching-data (Accessed: 12 October 2026).
