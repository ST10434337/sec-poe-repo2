import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import { ROLES } from './utils/constants.js'
import Layout from './components/Layout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import GigListPage from './pages/GigListPage.jsx'
import GigDetailPage from './pages/GigDetailPage.jsx'
import AccountPage from './pages/AccountPage.jsx'
import BookingsPage from './pages/BookingsPage.jsx'
import BookingDetailPage from './pages/BookingDetailPage.jsx'
import TransactionsPage from './pages/TransactionsPage.jsx'
import MyGigsPage from './pages/MyGigsPage.jsx'
import GigFormPage from './pages/GigFormPage.jsx'
import AdminUsersPage from './pages/AdminUsersPage.jsx'
import AdminTransactionsPage from './pages/AdminTransactionsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

// Every page in the app. They all share the Layout (nav bar + page container) ~> (React Router, n.d.)
// ProtectedRoute guards each group: login is needed, and only the listed roles get in
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/gigs" replace />} />

        {/* Public */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="gigs" element={<GigListPage />} />
        <Route path="gigs/:id" element={<GigDetailPage />} />

        {/* Any logged-in user */}
        <Route element={<ProtectedRoute />}>
          <Route path="account" element={<AccountPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
        </Route>

        {/* Client and freelancer */}
        <Route element={<ProtectedRoute roles={[ROLES.CLIENT, ROLES.FREELANCER]} />}>
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
        </Route>

        {/* Freelancer */}
        <Route element={<ProtectedRoute roles={[ROLES.FREELANCER]} />}>
          <Route path="my-gigs" element={<MyGigsPage />} />
          <Route path="my-gigs/new" element={<GigFormPage />} />
          <Route path="my-gigs/:id/edit" element={<GigFormPage />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route path="admin/transactions" element={<AdminTransactionsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App

// React Router (n.d.) Routing. Available at: https://reactrouter.com/start/declarative/routing (Accessed: 12 October 2026).
