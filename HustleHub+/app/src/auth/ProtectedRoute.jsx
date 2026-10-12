import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.js'
import { HOME_BY_ROLE } from '../utils/constants.js'

// Guards a group of pages ~> (The IIE, 2026)
//  Logged out: go to the login page, and come back here after logging in
//  Wrong role: show a message instead of the page
// This only hides pages. The API still checks the token and the role on every request
function ProtectedRoute({ roles }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location, message: 'Please log in to continue.' }} />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <>
        <h1>No access</h1>
        <p className="muted">You don't have access to this page.</p>
        <Link to={HOME_BY_ROLE[user.role] ?? '/gigs'} className="btn">Go to my home page</Link>
      </>
    )
  }

  // <Outlet /> shows the page that matched inside this group
  return <Outlet />
}

export default ProtectedRoute

// The Independent Institute of Education (IIE) (2026) Information Systems 3D (INSY7314/w): Module manual. LU4, p.123-127. The Independent Institute of Education (Pty) Ltd.
