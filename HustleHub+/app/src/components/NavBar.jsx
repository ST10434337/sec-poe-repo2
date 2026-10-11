import { Link, NavLink } from 'react-router-dom'

// Top navigation. NavLink marks the link for the current page as active ~> (React Router, n.d.)
// Guest links only for now; step 6 adds the links for each role and the Log out button
function NavBar() {
  return (
    <header className="site-header">
      <nav className="nav container" aria-label="Main">
        <Link to="/gigs" className="brand">HustleHub+</Link>
        <ul className="nav-links">
          <li><NavLink to="/gigs">Browse gigs</NavLink></li>
          <li><NavLink to="/login">Log in</NavLink></li>
          <li><NavLink to="/register">Register</NavLink></li>
        </ul>
      </nav>
    </header>
  )
}

export default NavBar

// React Router (n.d.) Navigating. Available at: https://reactrouter.com/start/declarative/navigating (Accessed: 12 October 2026).
