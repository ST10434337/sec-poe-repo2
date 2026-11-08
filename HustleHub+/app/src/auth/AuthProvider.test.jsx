import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { setAuthErrorHandler } from '../api/client.js'
import { render } from '@testing-library/react'
import { loadAuth, saveAuth } from './storage.js'
import AuthProvider from './AuthProvider.jsx'
import { useAuth } from './AuthContext.js'

vi.mock('../api/client.js', () => ({ setAuthErrorHandler: vi.fn() }))

function Probe() {
  const { user, login, logout, updateUser } = useAuth()
  const location = useLocation()
  return (
    <>
      <p>{user ? `${user.name}:${user.role}` : 'Logged out'}</p>
      <p>{location.pathname}</p>
      <p>{location.state?.message}</p>
      <button onClick={() => login({ token: 'new-token', user: { id: 'id-1', name: 'New', role: 'client' } })}>Login</button>
      <button onClick={() => updateUser({ role: 'freelancer' })}>Update user</button>
      <button onClick={logout}>Logout</button>
    </>
  )
}

function renderProvider(route = '/bookings') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider><Probe /></AuthProvider>
    </MemoryRouter>,
  )
}

describe('AuthProvider', () => {
  it('restores a saved session, updates user details, and logs out', () => {
    saveAuth({ token: 'old-token', user: { id: 'id-1', name: 'Old', role: 'client' } })
    renderProvider()

    expect(screen.getByText('Old:client')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Update user' }))
    expect(screen.getByText('Old:freelancer')).toBeInTheDocument()
    expect(loadAuth().user.role).toBe('freelancer')

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
    expect(screen.getByText('Logged out')).toBeInTheDocument()
    expect(loadAuth()).toBeNull()
  })

  it('logs in and persists the new session', () => {
    renderProvider()
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    expect(screen.getByText('New:client')).toBeInTheDocument()
    expect(loadAuth()).toEqual({
      token: 'new-token',
      user: { id: 'id-1', name: 'New', role: 'client' },
    })
  })

  it('logs out after an auth error and redirects with the original location', async () => {
    saveAuth({ token: 'old-token', user: { id: 'id-1', name: 'Old', role: 'client' } })
    renderProvider('/bookings?page=2')
    await waitFor(() => expect(setAuthErrorHandler).toHaveBeenCalled())

    act(() => setAuthErrorHandler.mock.calls.at(-1)[0]('Session ended'))
    expect(await screen.findByText('/login')).toBeInTheDocument()
    expect(screen.getByText('Session ended')).toBeInTheDocument()
    expect(loadAuth()).toBeNull()
  })

  it('clears auth without navigating when already on login', async () => {
    saveAuth({ token: 'old-token', user: { id: 'id-1', name: 'Old', role: 'client' } })
    renderProvider('/login')
    await waitFor(() => expect(setAuthErrorHandler).toHaveBeenCalled())
    act(() => setAuthErrorHandler.mock.calls.at(-1)[0]('Invalid session'))
    expect(screen.getByText('/login')).toBeInTheDocument()
    expect(loadAuth()).toBeNull()
  })
})
