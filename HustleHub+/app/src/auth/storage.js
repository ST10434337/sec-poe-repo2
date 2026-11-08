// Keeps the login ({ token, user }) in sessionStorage
// It survives a page refresh, and is cleared when the tab closes or the user logs out
// Any storage JavaScript can read is exposed if an XSS bug exists, so the app never renders HTML
// from users and the CSP stays strict ~> (OWASP, n.d.)

const KEY = 'hustlehub.auth'

// Returns { token, user }, or null when logged out or the saved value is broken
export const loadAuth = () => {
  try {
    const auth = JSON.parse(sessionStorage.getItem(KEY))
    return typeof auth?.token === 'string' && auth.user ? auth : null
  } catch {
    return null
  }
}

export const saveAuth = (auth) => sessionStorage.setItem(KEY, JSON.stringify(auth))

export const clearAuth = () => sessionStorage.removeItem(KEY)

export const getToken = () => loadAuth()?.token ?? null

// OWASP (n.d.) HTML5 Security Cheat Sheet: Local Storage. Available at: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage (Accessed: 12 October 2026).
