import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// The API address is read when client.js loads, so it is set first and client.js is loaded after ~> (Vitest, n.d.)
let apiRequest, setAuthErrorHandler
beforeAll(async () => {
  vi.stubEnv('VITE_API_URL', 'https://api.test')
  ;({ apiRequest, setAuthErrorHandler } = await import('./client.js'))
})
afterAll(() => vi.unstubAllEnvs())

// A pretend fetch that answers with this status and body
const reply = (status, body) =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })),
  )

const saveLogin = () =>
  sessionStorage.setItem('hustlehub.auth', JSON.stringify({ token: 'test-token', user: { id: '1', role: 'client' } }))

describe('apiRequest', () => {
  const onAuthError = vi.fn()
  beforeEach(() => setAuthErrorHandler(onAuthError))

  it('sends the saved token and a JSON body', async () => {
    saveLogin()
    reply(200, { ok: true })

    await apiRequest('/api/bookings', { method: 'POST', body: { gigId: 'abc' } })

    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe('https://api.test/api/bookings')
    expect(options.headers.Authorization).toBe('Bearer test-token')
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(options.body).toBe('{"gigId":"abc"}')
  })

  it('logs the user out when the API rejects their token', async () => {
    saveLogin()
    reply(401, { message: 'Invalid or expired token' })

    await expect(apiRequest('/api/auth/me')).rejects.toMatchObject({
      status: 401,
      message: 'Your session has ended. Please log in again.',
    })
    expect(onAuthError).toHaveBeenCalled()
  })

  it('does not log anyone out for a wrong password (no token is sent at login)', async () => {
    reply(401, { message: 'Invalid credentials' })

    await expect(apiRequest('/api/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 401 })
    expect(onAuthError).not.toHaveBeenCalled()
  })

  it('gives a friendly message when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(apiRequest('/api/gigs')).rejects.toMatchObject({
      status: 0,
      message: expect.stringMatching(/Cannot reach the server/),
    })
  })

  it('hides server error details behind a general message', async () => {
    reply(500, '<html>Internal error with a stack trace</html>')

    await expect(apiRequest('/api/gigs')).rejects.toMatchObject({
      status: 500,
      message: 'Something went wrong. Please try again.',
    })
  })
})

// Vitest. n.d. Mocking: Globals and Environment Variables. [online] Available at: https://vitest.dev/guide/mocking (Accessed: 12 October 2026).
