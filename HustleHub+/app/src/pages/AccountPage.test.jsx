import { cleanup, fireEvent, screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { becomeFreelancer, getMe } from '../api/auth.js'
import { CLIENT, FREELANCER, renderWithAuth } from '../test/renderWithAuth.jsx'
import AccountPage from './AccountPage.jsx'

vi.mock('../api/auth.js', () => ({ becomeFreelancer: vi.fn(), getMe: vi.fn() }))

function renderAccount(user) {
  return renderWithAuth(
    <Routes>
      <Route path="/account" element={<AccountPage />} />
      <Route path="/my-gigs" element={<p>My gigs page</p>} />
    </Routes>,
    { user, route: '/account' },
  )
}

describe('AccountPage', () => {
  beforeEach(() => {
    getMe.mockResolvedValue(CLIENT)
  })

  it('shows saved details and refreshes the auth user from the API', async () => {
    const { auth } = renderAccount(CLIENT)
    expect(screen.getByText(CLIENT.name)).toBeInTheDocument()
    expect(await screen.findByText('client@example.test')).toBeInTheDocument()
    expect(auth.updateUser).toHaveBeenCalledWith(CLIENT)
    expect(screen.getByRole('button', { name: 'Become a freelancer' })).toBeInTheDocument()
  })

  it('does not upgrade after the user declines confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderAccount(CLIENT)
    fireEvent.click(screen.getByRole('button', { name: 'Become a freelancer' }))
    expect(becomeFreelancer).not.toHaveBeenCalled()
  })

  it('saves the upgraded session and navigates to My gigs', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const nextSession = { token: 'new-token', user: FREELANCER }
    becomeFreelancer.mockResolvedValue(nextSession)
    const { auth } = renderAccount(CLIENT)
    fireEvent.click(screen.getByRole('button', { name: 'Become a freelancer' }))
    expect(await screen.findByText('My gigs page')).toBeInTheDocument()
    expect(auth.login).toHaveBeenCalledWith(nextSession)
  })

  it('shows server errors and hides upgrade controls for a freelancer', async () => {
    becomeFreelancer.mockRejectedValue(new Error('Upgrade failed'))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderAccount(CLIENT)
    fireEvent.click(screen.getByRole('button', { name: 'Become a freelancer' }))
    expect(await screen.findByText('Upgrade failed')).toBeInTheDocument()

    cleanup()
    renderAccount(FREELANCER)
    expect(screen.queryByRole('button', { name: 'Become a freelancer' })).not.toBeInTheDocument()
  })
})
