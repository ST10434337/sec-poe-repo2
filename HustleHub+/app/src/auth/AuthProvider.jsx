import { useEffect, useState } from 'react'
import { AuthContext } from './AuthContext.js'
import { clearAuth, loadAuth, saveAuth } from './storage.js'
import { setAuthErrorHandler } from '../api/client.js'

// Holds the login for the whole app and keeps it in step with sessionStorage
function AuthProvider({ children }) {
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

  // When the API rejects the token, or the account is disabled, log out here too
  useEffect(() => {
    setAuthErrorHandler(() => {
      clearAuth()
      setAuth(null)
    })
    return () => setAuthErrorHandler(() => {})
  }, [])

  return (
    <AuthContext.Provider value={{ user: auth?.user ?? null, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
