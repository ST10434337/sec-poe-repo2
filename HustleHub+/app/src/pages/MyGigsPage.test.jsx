import { fireEvent, screen } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { deleteGig, getMyGigs } from '../api/gigs.js'
import { FREELANCER, renderWithAuth } from '../test/renderWithAuth.jsx'
import MyGigsPage from './MyGigsPage.jsx'

vi.mock('../api/gigs.js', () => ({ deleteGig: vi.fn(), getMyGigs: vi.fn() }))

function LocationMessage() {
  const location = useLocation()
  return <p>{location.state?.message}</p>
}

function renderMyGigs() {
  return renderWithAuth(
    <Routes>
      <Route path="/my-gigs" element={<><MyGigsPage /><LocationMessage /></>} />
      <Route path="/my-gigs/new" element={<p>Create form</p>} />
    </Routes>,
    { user: FREELANCER, route: '/my-gigs' },
  )
}

describe('MyGigsPage', () => {
  it('lists active and deleted gigs with the right available actions', async () => {
    getMyGigs.mockResolvedValue({
      gigs: [
        { _id: 'active', title: 'Active gig', category: 'creative-design', price: 600, isActive: true, createdAt: '2025-01-01' },
        { _id: 'deleted', title: 'Deleted gig', category: 'unknown', price: 100, isActive: false, createdAt: '2025-01-02' },
      ],
      page: 1,
      totalPages: 1,
    })
    renderMyGigs()

    expect(await screen.findByText('Active gig')).toBeInTheDocument()
    expect(screen.getByText('Deleted gig')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Deleted')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Edit: Active gig/ })).toHaveAttribute('href', '/my-gigs/active/edit')
    expect(screen.queryByRole('link', { name: /Deleted gig/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create a gig' })).toHaveAttribute('href', '/my-gigs/new')
  })

  it('keeps the list unchanged when delete is cancelled', async () => {
    getMyGigs.mockResolvedValue({
      gigs: [{ _id: 'active', title: 'Active gig', isActive: true }],
      page: 1,
      totalPages: 1,
    })
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderMyGigs()
    fireEvent.click(await screen.findByRole('button', { name: /Delete: Active gig/ }))
    expect(deleteGig).not.toHaveBeenCalled()
  })

  it('deletes a gig, reloads the list, and shows the success message', async () => {
    getMyGigs.mockResolvedValue({
      gigs: [{ _id: 'active', title: 'Active gig', isActive: true }],
      page: 1,
      totalPages: 1,
    })
    deleteGig.mockResolvedValue({})
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderMyGigs()
    fireEvent.click(await screen.findByRole('button', { name: /Delete: Active gig/ }))
    expect(await screen.findByText('Gig deleted.')).toBeInTheDocument()
    expect(deleteGig).toHaveBeenCalledWith('active')
    expect(getMyGigs).toHaveBeenCalledTimes(2)
  })

  it('shows load and delete errors', async () => {
    getMyGigs.mockRejectedValueOnce(new Error('Could not load gigs'))
    renderMyGigs()
    expect(await screen.findByText('Could not load gigs')).toBeInTheDocument()

    getMyGigs.mockResolvedValue({
      gigs: [{ _id: 'active', title: 'Active gig', isActive: true }],
      page: 1,
      totalPages: 1,
    })
    deleteGig.mockRejectedValue(new Error('Could not delete gig'))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderMyGigs()
    fireEvent.click(await screen.findByRole('button', { name: /Delete: Active gig/ }))
    expect(await screen.findByText('Could not delete gig')).toBeInTheDocument()
  })
})
