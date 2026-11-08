import { beforeEach, describe, expect, it } from 'vitest'
import { clearAuth, getToken, loadAuth, saveAuth } from './storage.js'

describe('auth storage', () => {
  beforeEach(() => sessionStorage.clear())

  it('saves and loads a valid session and returns its token', () => {
    const auth = { token: 'token-value', user: { id: 'user-id' } }
    saveAuth(auth)
    expect(loadAuth()).toEqual(auth)
    expect(getToken()).toBe('token-value')
  })

  it('treats missing, incomplete, and malformed sessions as logged out', () => {
    expect(loadAuth()).toBeNull()
    sessionStorage.setItem('hustlehub.auth', JSON.stringify({ token: 'token' }))
    expect(loadAuth()).toBeNull()
    sessionStorage.setItem('hustlehub.auth', '{')
    expect(loadAuth()).toBeNull()
    expect(getToken()).toBeNull()
  })

  it('clears a saved session', () => {
    saveAuth({ token: 'token', user: { id: 'user-id' } })
    clearAuth()
    expect(loadAuth()).toBeNull()
  })
})
