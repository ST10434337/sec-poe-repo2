import { getToken } from '../auth/storage.js'

// Every API request goes through apiRequest, so errors are handled the same way on every page
// The API answers errors as { message }, and those messages are safe to show ~> (The IIE, 2026)

// Set in .env (copy .env.example). Any trailing slash is removed
// A plain loop instead of a regex, so it always runs in linear time ~> (SonarSource, n.d.; OWASP, n.d.)
function trimTrailingSlashes(url) {
  let end = url.length
  while (end > 0 && url[end - 1] === '/') end--
  return url.slice(0, end)
}
const BASE_URL = trimTrailingSlashes(import.meta.env.VITE_API_URL ?? '')

const NETWORK_ERROR = 'Cannot reach the server. Check the API is running, and that you accepted its HTTPS certificate.'
const SERVER_ERROR = 'Something went wrong. Please try again.'
const TOO_MANY = 'Too many requests. Please wait a few minutes and try again.'
const SESSION_ENDED = 'Your session has ended. Please log in again.'

// AuthProvider sets this, so a rejected token logs the user out
let onAuthError = () => {}
export const setAuthErrorHandler = (handler) => {
  onAuthError = handler
}

// An error with a message that is safe to show, plus the HTTP status (0 = no reply)
export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  if (!BASE_URL)
    throw new ApiError(0, 'VITE_API_URL is not set. Copy .env.example to .env and restart the dev server.')

  const token = getToken()
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    // fetch only throws when there is no reply at all (server down, certificate not accepted, CORS)
    throw new ApiError(0, NETWORK_ERROR)
  }

  // Some error replies (for example a proxy error page) are not JSON
  const data = await res.json().catch(() => null)
  if (res.ok) return data

  let message = typeof data?.message === 'string' ? data.message : SERVER_ERROR
  if (res.status === 429) message = TOO_MANY
  if (res.status >= 500) message = SERVER_ERROR

  // A token was sent but the API rejected it, or the account was disabled: end the session
  // Login itself also returns 401, but no token is sent then, so a wrong password does not log anyone out
  if (token && (res.status === 401 || message === 'Account is disabled')) {
    message = res.status === 401 ? SESSION_ENDED : 'This account is disabled. Contact an admin if you think this is a mistake.'
    // The reason is shown on the login page, so the user knows why they were logged out
    onAuthError(message)
  }

  throw new ApiError(res.status, message)
}

// Builds "?page=2&q=logo" from an object, skipping empty values ~> (MDN Web Docs, n.d.)
export const withQuery = (params = {}) => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

// The Independent Institute of Education (IIE) (2026) Information Systems 3D (INSY7314/w): Module manual. LU4, p.108-110. The Independent Institute of Education (Pty) Ltd.
// MDN Web Docs (n.d.) URLSearchParams. Available at: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams (Accessed: 12 October 2026).

// OWASP. n.d. Regular expression Denial of Service - ReDoS. [online]. Available at: https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS. [Accessed 7 November 2026]
// SonarSource. n.d. Regular expressions should not cause non-linear backtracking (javascript:S8786). [online]. Available at: https://sonarcloud.io/organizations/sonarsource/rules?open=javascript%3AS8786&rule_key=javascript%3AS8786. [Accessed 7 November 2026]
