import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { register } from '../api/auth.js'
import { renderWithAuth } from '../test/renderWithAuth.jsx'
import RegisterPage from './RegisterPage.jsx'

vi.mock('../api/auth.js', () => ({ register: vi.fn() }))

// Fill in the form; tests change one value to check one rule
async function fillForm(user, { password = 'Passw0rd!', confirm = password } = {}) {
  await user.type(screen.getByLabelText('Name'), 'Test Client')
  await user.type(screen.getByLabelText('Email'), 'client@example.test')
  await user.type(screen.getByLabelText('Password'), password)
  await user.type(screen.getByLabelText('Confirm password'), confirm)
}

describe('RegisterPage', () => {
  it('only offers client and freelancer, never admin', () => {
    renderWithAuth(<RegisterPage />)

    const roles = screen.getAllByRole('radio').map((radio) => radio.value)
    expect(roles).toEqual(['client', 'freelancer'])
  })

  it('does not show an error box before anything goes wrong', () => {
    renderWithAuth(<RegisterPage />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows the password rules, and blocks a weak password', async () => {
    const user = userEvent.setup()
    renderWithAuth(<RegisterPage />)
    expect(screen.getByText(/one of @ \$ ! % \* \? &/)).toBeInTheDocument()

    await fillForm(user, { password: 'password' })
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByText('Password does not meet the rules above.')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('blocks passwords that do not match', async () => {
    const user = userEvent.setup()
    renderWithAuth(<RegisterPage />)

    await fillForm(user, { password: 'Passw0rd!', confirm: 'Passw0rd?' })
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('sends only the fields the API needs (never the confirm password)', async () => {
    const user = userEvent.setup()
    register.mockResolvedValue({ token: 't', user: { id: '1', name: 'Test Client', email: 'client@example.test', role: 'client' } })
    renderWithAuth(<RegisterPage />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(register).toHaveBeenCalledWith({
      name: 'Test Client',
      email: 'client@example.test',
      password: 'Passw0rd!',
      role: 'client',
    })
  })
})
