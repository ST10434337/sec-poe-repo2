import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from './AuthContext.js'
import { clearAuth, loadAuth, saveAuth } from './storage.js'
import { setAuthErrorHandler } from '../api/client.js'

// Holds the login for the whole app and keeps it in step with sessionStorage
function AuthProvider({ children }) {
  const navigate = useNavigate()
  // Start from the saved login, so a page refresh keeps the user logged in
  const [auth, setAuth] = useState(loadAuth)

  // Save the { token, user } returned by register, login or become-freelancer
  const login = ({ token, user }) => {
    saveAuth({ token, user })
    setAuth({ token, user })
  }

  const logout = () => {
    clearAuth()
    setAuth(null)
  }

  // Refresh saved details (for example the role) after the Account page calls /me
  const updateUser = (changes) => {
    if (!auth) return
    const next = { ...auth, user: { ...auth.user, ...changes } }
    saveAuth(next)
    setAuth(next)
  }

  // When the API rejects the token, or the account is disabled: log out, and show why on the login page
  // "from" brings the user back to the same page if they can log in again
  useEffect(() => {
    setAuthErrorHandler((reason) => {
      clearAuth()
      setAuth(null)
      const { pathname, search } = window.location
      // Several requests can fail together; only the first one needs to go to the login page
      if (pathname === '/login') return
      navigate('/login', { replace: true, state: { message: reason, type: 'error', from: { pathname, search } } })
    })
    return () => setAuthErrorHandler(() => {})
  }, [navigate])

  return (
    <AuthContext.Provider value={{ user: auth?.user ?? null, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
