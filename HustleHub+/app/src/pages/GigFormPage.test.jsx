import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { createGig } from '../api/gigs.js'
import { FREELANCER, renderWithAuth } from '../test/renderWithAuth.jsx'
import GigFormPage from './GigFormPage.jsx'

vi.mock('../api/gigs.js', () => ({ createGig: vi.fn(), getGig: vi.fn(), updateGig: vi.fn() }))

const renderCreateForm = () =>
  renderWithAuth(
    <Routes>
      <Route path="/my-gigs/new" element={<GigFormPage />} />
      <Route path="/my-gigs" element={<p>My gigs page</p>} />
    </Routes>,
    { user: FREELANCER, route: '/my-gigs/new' },
  )

async function fillForm(user, price) {
  await user.type(screen.getByLabelText('Title'), 'Logo design')
  await user.type(screen.getByLabelText('Description'), 'A clean, modern logo for your business.')
  await user.selectOptions(screen.getByLabelText('Category'), 'creative-design')
  await user.type(screen.getByLabelText('Price (R)'), price)
}

describe('GigFormPage', () => {
  it('blocks a price that is not a whole number of rand', async () => {
    const user = userEvent.setup()
    renderCreateForm()

    await fillForm(user, '1.5')
    await user.click(screen.getByRole('button', { name: 'Create gig' }))

    expect(screen.getByText('Enter a whole number of rand from 1 to 1,000,000.')).toBeInTheDocument()
    expect(createGig).not.toHaveBeenCalled()
  })

  it('shows a message for every empty field and sends nothing', async () => {
    const user = userEvent.setup()
    renderCreateForm()

    await user.click(screen.getByRole('button', { name: 'Create gig' }))

    expect(screen.getByText('Title must be 3 to 100 characters.')).toBeInTheDocument()
    expect(screen.getByText('Description must be 10 to 2000 characters.')).toBeInTheDocument()
    expect(screen.getByText('Choose a category.')).toBeInTheDocument()
    expect(screen.getByText('Enter a whole number of rand from 1 to 1,000,000.')).toBeInTheDocument()
    expect(createGig).not.toHaveBeenCalled()
  })

  it('sends a valid gig with the price as a number, then goes back to My gigs', async () => {
    const user = userEvent.setup()
    createGig.mockResolvedValue({ gig: {} })
    renderCreateForm()

    await fillForm(user, '750')
    await user.click(screen.getByRole('button', { name: 'Create gig' }))

    expect(createGig).toHaveBeenCalledWith({
      title: 'Logo design',
      description: 'A clean, modern logo for your business.',
      category: 'creative-design',
      price: 750,
    })
    expect(await screen.findByText('My gigs page')).toBeInTheDocument()
  })
})
