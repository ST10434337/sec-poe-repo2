import { fireEvent, screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { listGigs } from '../api/gigs.js'
import { renderWithAuth } from '../test/renderWithAuth.jsx'
import GigListPage from './GigListPage.jsx'

vi.mock('../api/gigs.js', () => ({ listGigs: vi.fn() }))

function renderGigList(route = '/gigs') {
  return renderWithAuth(
    <Routes>
      <Route path="/gigs" element={<GigListPage />} />
    </Routes>,
    { route },
  )
}

const listing = {
  gigs: [{
    _id: 'gig-1',
    title: 'Logo design',
    description: 'A clean logo',
    category: 'creative-design',
    price: 500,
    freelancer: { name: 'Sam' },
  }],
  page: 1,
  totalPages: 2,
  total: 1,
}

describe('GigListPage', () => {
  it('shows results, search links, and updates the page query', async () => {
    listGigs.mockResolvedValue(listing)
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    renderGigList('/gigs?q=logo')

    expect(await screen.findByText((_, element) => element.classList?.contains('results-summary'))).toHaveTextContent('1 gig found')
    expect(screen.getByRole('link', { name: 'Clear search' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Logo design/ })).toHaveAttribute('href', '/gigs/gig-1')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(listGigs).toHaveBeenLastCalledWith({ q: 'logo', category: '', page: '2' })
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0 })
  })

  it('submits trimmed search fields and resets the page number', async () => {
    listGigs.mockResolvedValue({ ...listing, gigs: [], page: 1, totalPages: 1, total: 0 })
    renderGigList('/gigs?page=4')
    await screen.findByText('There are no gigs yet. Check back soon.')
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: '  logo  ' } })
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'creative-design' } })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    expect(await screen.findByText('No gigs found. Try a different search.')).toBeInTheDocument()
    expect(listGigs).toHaveBeenLastCalledWith({
      q: 'logo',
      category: 'creative-design',
      page: '',
    })
  })

  it('shows plural totals and an unfiltered empty state', async () => {
    listGigs.mockResolvedValue({ gigs: [], page: 1, totalPages: 1, total: 0 })
    renderGigList()
    expect(await screen.findByText((_, element) => element.classList?.contains('results-summary'))).toHaveTextContent('0 gigs found')
    expect(screen.getByText('There are no gigs yet. Check back soon.')).toBeInTheDocument()
  })

  it('shows a load error and offers a way to clear filtered results', async () => {
    listGigs.mockRejectedValue(new Error('Unavailable'))
    renderGigList('/gigs?q=logo')
    expect(await screen.findByText('Unavailable')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Clear search' })).toBeInTheDocument()
  })
})
