import { Outlet, useLocation } from 'react-router-dom'
import NavBar from './NavBar.jsx'
import Alert from './Alert.jsx'

// The frame every page shares: the nav bar on top, the current page below
// <Outlet /> is where React Router puts the page that matches the URL ~> (React Router, n.d.)
// A page can pass a message to the next page with navigate(path, { state: { message, type } })
// It is shown here, above the page, so every page shows messages the same way
function Layout() {
  const location = useLocation()
  const message = location.state?.message

  return (
    <>
      <NavBar />
      <main className="container">
        {message && <Alert type={location.state.type ?? 'info'}>{message}</Alert>}
        <Outlet />
      </main>
    </>
  )
}

export default Layout

// React Router. n.d. Routing: Layout Routes. [online] Available at: https://reactrouter.com/start/declarative/routing (Accessed: 12 October 2026).
