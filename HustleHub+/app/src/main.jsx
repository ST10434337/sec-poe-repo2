import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AuthProvider from './auth/AuthProvider.jsx'
import './index.css'
import App from './App.jsx'

// BrowserRouter keeps the page in step with the address bar
// useTransitions={false}: a page change happens in the same update as a login or logout,
// so a guarded page never briefly sees the new login state on the old page ~> (React Router, n.d.)
// AuthProvider shares the logged-in user with every page
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter useTransitions={false}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

// React Router (n.d.) BrowserRouter: useTransitions. Available at: https://reactrouter.com/api/declarative-routers/BrowserRouter (Accessed: 12 October 2026).
