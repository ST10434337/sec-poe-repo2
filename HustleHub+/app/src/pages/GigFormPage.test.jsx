import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { createGig, getGig, updateGig } from '../api/gigs.js'
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

const existingGig = {
  _id: 'gig-1',
  title: 'Logo design',
  description: 'A clean, modern logo for your business.',
  category: 'creative-design',
  price: 750,
  freelancer: { _id: FREELANCER.id },
}

const renderEditForm = (route = `/my-gigs/${existingGig._id}/edit`, user = FREELANCER) =>
  renderWithAuth(
    <Routes>
      <Route path="/my-gigs/:id/edit" element={<GigFormPage />} />
      <Route path="/my-gigs" element={<p>My gigs page</p>} />
    </Routes>,
    { user, route },
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

  it('loads and updates an owned gig', async () => {
    const user = userEvent.setup()
    getGig.mockResolvedValue({ gig: existingGig })
    updateGig.mockResolvedValue({ gig: existingGig })
    renderEditForm()

    expect(await screen.findByDisplayValue('Logo design')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'Updated logo design')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(updateGig).toHaveBeenCalledWith('gig-1', {
      title: 'Updated logo design',
      description: existingGig.description,
      category: existingGig.category,
      price: 750,
    })
    expect(await screen.findByText('My gigs page')).toBeInTheDocument()
  })

  it('blocks editing another freelancer’s gig', async () => {
    getGig.mockResolvedValue({
      gig: { ...existingGig, freelancer: { _id: 'another-freelancer' } },
    })
    renderEditForm()
    expect(await screen.findByText('You can only change your own gigs.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument()
  })

  it.each([
    [{ status: 404, message: 'Missing' }, "This gig can't be edited"],
    [{ status: 503, message: 'Unavailable' }, 'Could not load this gig'],
  ])('shows a useful error when an edit gig cannot be loaded', async (failure, heading) => {
    getGig.mockRejectedValue(failure)
    renderEditForm()
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
  })

  it('shows a save error and permits retrying', async () => {
    const user = userEvent.setup()
    createGig.mockRejectedValueOnce(new Error('Save failed')).mockResolvedValue({})
    renderCreateForm()
    await fillForm(user, '100')
    await user.click(screen.getByRole('button', { name: 'Create gig' }))
    expect(await screen.findByText('Save failed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create gig' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Create gig' }))
    expect(await screen.findByText('My gigs page')).toBeInTheDocument()
  })
})
