import { createContext, useContext } from 'react'

// The logged-in user and the login/logout functions, shared with every page
// AuthProvider fills it in; tests can pass their own value instead ~> (React, n.d.)
export const AuthContext = createContext(null)

// Returns { user, login, logout, updateUser }; user is null when logged out
export const useAuth = () => useContext(AuthContext)

// React (n.d.) useContext. Available at: https://react.dev/reference/react/useContext (Accessed: 12 October 2026).
