import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { login as loginRequest } from '../api/auth.js'
import { ApiError } from '../api/client.js'
import { CLIENT, renderWithAuth } from '../test/renderWithAuth.jsx'
import LoginPage from './LoginPage.jsx'

// The real API is never called; the login request is replaced with a pretend one ~> (Vitest, n.d.)
vi.mock('../api/auth.js', () => ({ login: vi.fn() }))

const renderLogin = () =>
  renderWithAuth(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/gigs" element={<p>Browse page</p>} />
    </Routes>,
    { route: '/login' },
  )

describe('LoginPage', () => {
  it('shows both messages for an empty form and sends nothing', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(screen.getByText('Enter your email.')).toBeInTheDocument()
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()
    expect(loginRequest).not.toHaveBeenCalled()
  })

  it('logs in with the typed details and goes to the home page', async () => {
    const user = userEvent.setup()
    loginRequest.mockResolvedValue({ token: 'test-token', user: CLIENT })
    const { auth } = renderLogin()

    await user.type(screen.getByLabelText('Email'), 'client@example.test')
    await user.type(screen.getByLabelText('Password'), 'Passw0rd!')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(loginRequest).toHaveBeenCalledWith({ email: 'client@example.test', password: 'Passw0rd!' })
    expect(auth.login).toHaveBeenCalledWith({ token: 'test-token', user: CLIENT })
    expect(await screen.findByText('Browse page')).toBeInTheDocument()
  })

  it('shows a friendly message for a wrong password', async () => {
    const user = userEvent.setup()
    loginRequest.mockRejectedValue(new ApiError(401, 'Invalid credentials'))
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'client@example.test')
    await user.type(screen.getByLabelText('Password'), 'WrongPass1!')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.')
  })

  it('can show the typed password, and hides it again when the form is sent', async () => {
    const user = userEvent.setup()
    renderLogin()
    const password = screen.getByLabelText('Password')

    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByLabelText('Show password'))
    expect(password).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(password).toHaveAttribute('type', 'password')
  })
})

// Vitest. n.d. Mocking: Modules. [online] Available at: https://vitest.dev/guide/mocking/modules (Accessed: 12 October 2026).
