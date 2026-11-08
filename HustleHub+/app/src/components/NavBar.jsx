import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { ROLES } from '../utils/constants.js'

// The links each role sees; hiding links is only for convenience, the API still checks every request
const LINKS = {
  guest: [
    { to: '/gigs', label: 'Browse gigs' },
    { to: '/login', label: 'Log in' },
    { to: '/register', label: 'Register' },
  ],
  [ROLES.CLIENT]: [
    { to: '/gigs', label: 'Browse gigs' },
    { to: '/bookings', label: 'My bookings' },
    { to: '/transactions', label: 'My payments' },
    { to: '/account', label: 'Account' },
  ],
  [ROLES.FREELANCER]: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/gigs', label: 'Browse gigs' },
    { to: '/my-gigs', label: 'My gigs' },
    { to: '/bookings', label: 'Bookings' },
    { to: '/transactions', label: 'Payments' },
    { to: '/account', label: 'Account' },
  ],
  [ROLES.ADMIN]: [
    { to: '/gigs', label: 'Browse gigs' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/transactions', label: 'All transactions' },
    { to: '/account', label: 'Account' },
  ],
}

// Top navigation. NavLink marks the link for the current page as active ~> (React Router, n.d.)
function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = (user && LINKS[user.role]) || LINKS.guest

  // The API has no logout route (tokens are stateless), so logging out clears the saved token
  const handleLogout = () => {
    logout()
    navigate('/login', { state: { message: 'You have logged out.' } })
  }

  return (
    <header className="site-header">
      <nav className="nav container" aria-label="Main">
        <Link to="/gigs" className="brand">HustleHub+</Link>
        <ul className="nav-links">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to}>{link.label}</NavLink>
            </li>
          ))}
        </ul>
        {user && (
          <div className="nav-user">
            <span className="muted">Hi, {user.name}</span>
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </nav>
    </header>
  )
}

export default NavBar

// React Router n.d. Navigating. [online] Available at: https://reactrouter.com/start/declarative/navigating (Accessed: 12 October 2026).
