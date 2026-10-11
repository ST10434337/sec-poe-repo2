import { Outlet } from 'react-router-dom'
import NavBar from './NavBar.jsx'

// The frame every page shares: the nav bar on top, the current page below
// <Outlet /> is where React Router puts the page that matches the URL ~> (React Router, n.d.)
function Layout() {
  return (
    <>
      <NavBar />
      <main className="container">
        <Outlet />
      </main>
    </>
  )
}

export default Layout

// React Router (n.d.) Routing: Layout Routes. Available at: https://reactrouter.com/start/declarative/routing (Accessed: 12 October 2026).
