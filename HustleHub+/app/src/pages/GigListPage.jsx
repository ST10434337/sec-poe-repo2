import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { listGigs } from '../api/gigs.js'
import { useApi } from '../hooks/useApi.js'
import Alert from '../components/Alert.jsx'
import FormField from '../components/FormField.jsx'
import GigCard from '../components/GigCard.jsx'
import Pagination from '../components/Pagination.jsx'
import { CATEGORIES } from '../utils/constants.js'

// Public list of active gigs, with search, a category filter and pages
// The search lives in the URL (?q=&category=&page=), so Back, Refresh and shared links keep it ~> (React Router, n.d.)
function GigListPage() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const category = searchParams.get('category') ?? ''
  const page = searchParams.get('page') ?? ''

  // The API ignores a bad page number and rejects a bad category or a search over 100 characters
  const { data, error, loading } = useApi(() => listGigs({ q, category, page }), [q, category, page])
  const filtered = Boolean(q || category)

  // Search only runs when the form is sent, not on every key press, to stay under the rate limit
  function handleSearch(e) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const next = {}
    const text = String(form.get('q') ?? '').trim()
    if (text) next.q = text
    if (form.get('category')) next.category = form.get('category')
    // A new search starts again on page 1
    setSearchParams(next)
  }

  function handlePageChange(nextPage) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('page', String(nextPage))
      return next
    })
    window.scrollTo({ top: 0 })
  }

  return (
    <>
      <h1>Browse gigs</h1>

      {/* The key resets the boxes when the URL changes, for example after pressing Back */}
      <form key={`${q}|${category}`} className="card search-form" onSubmit={handleSearch} role="search">
        <FormField id="q" label="Search" type="search" maxLength={100} defaultValue={q} placeholder="e.g. logo, website" />
        <FormField id="category" label="Category" as="select" defaultValue={category}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </FormField>
        <button type="submit" className="btn">Search</button>
      </form>

      {loading && <p className="muted">Loading gigs…</p>}

      {!loading && error && (
        <>
          <Alert type="error">{error}</Alert>
          {filtered && <Link to="/gigs">Clear search</Link>}
        </>
      )}

      {!loading && data && (
        <>
          <p className="results-summary">
            {data.total} {data.total === 1 ? 'gig' : 'gigs'} found
            {filtered && (
              <>
                {' · '}
                <Link to="/gigs">Clear search</Link>
              </>
            )}
          </p>

          {data.gigs.length === 0 ? (
            <p className="card">
              {filtered ? 'No gigs found. Try a different search.' : 'There are no gigs yet. Check back soon.'}
            </p>
          ) : (
            <div className="grid">
              {data.gigs.map((gig) => (
                <GigCard key={gig._id} gig={gig} backTo={`${location.pathname}${location.search}`} />
              ))}
            </div>
          )}

          <Pagination page={data.page} totalPages={data.totalPages} onChange={handlePageChange} />
        </>
      )}
    </>
  )
}

export default GigListPage

// React Router (n.d.) useSearchParams. Available at: https://reactrouter.com/api/hooks/useSearchParams (Accessed: 12 October 2026).
