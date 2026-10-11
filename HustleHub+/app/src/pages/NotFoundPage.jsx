import { Link } from 'react-router-dom'

// Shown for any address that does not match a page
function NotFoundPage() {
  return (
    <>
      <h1>Page not found</h1>
      <p className="muted">The page you were looking for does not exist.</p>
      <Link to="/gigs" className="btn">Browse gigs</Link>
    </>
  )
}

export default NotFoundPage
