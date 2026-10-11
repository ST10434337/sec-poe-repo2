import { Navigate, Route, Routes } from 'react-router-dom'
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
// Step 4 wraps the logged-in and role-only groups in ProtectedRoute
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
        <Route path="account" element={<AccountPage />} />
        <Route path="bookings/:id" element={<BookingDetailPage />} />

        {/* Client and freelancer */}
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />

        {/* Freelancer */}
        <Route path="my-gigs" element={<MyGigsPage />} />
        <Route path="my-gigs/new" element={<GigFormPage />} />
        <Route path="my-gigs/:id/edit" element={<GigFormPage />} />

        {/* Admin */}
        <Route path="admin/users" element={<AdminUsersPage />} />
        <Route path="admin/transactions" element={<AdminTransactionsPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App

// React Router (n.d.) Routing. Available at: https://reactrouter.com/start/declarative/routing (Accessed: 12 October 2026).
