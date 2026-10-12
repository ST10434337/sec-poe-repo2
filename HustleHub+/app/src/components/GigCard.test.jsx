import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import GigCard from './GigCard.jsx'

const gig = {
  _id: 'a'.repeat(24),
  title: '<script>alert(1)</script>',
  description: '<img src=x onerror=alert(1)> A clean logo.',
  category: 'creative-design',
  price: 500,
  freelancer: { _id: 'f'.repeat(24), name: 'Test Freelancer' },
}

const renderCard = (card) =>
  render(
    <MemoryRouter>
      <GigCard gig={card} />
    </MemoryRouter>,
  )

describe('GigCard', () => {
  // React escapes text, so HTML typed by a user is shown as plain text and never run ~> (React, n.d.)
  it('shows HTML in a title or description as plain text, without running it', () => {
    const { container } = renderCard(gig)

    expect(screen.getByRole('heading', { name: '<script>alert(1)</script>' })).toBeInTheDocument()
    expect(screen.getByText('<img src=x onerror=alert(1)> A clean logo.')).toBeInTheDocument()
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
  })

  it('shows the category label, price in rand, freelancer name and a link to the gig', () => {
    renderCard({ ...gig, title: 'Logo design' })

    expect(screen.getByText('Creative & design')).toBeInTheDocument()
    expect(screen.getByText(/R\s?500/)).toBeInTheDocument()
    expect(screen.getByText('by Test Freelancer')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View gig/ })).toHaveAttribute('href', `/gigs/${gig._id}`)
  })
})

// React. n.d. Writing Markup with JSX. [online] Available at: https://react.dev/learn/writing-markup-with-jsx (Accessed: 12 October 2026).
