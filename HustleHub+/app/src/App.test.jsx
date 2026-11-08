import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App.jsx'
import { AuthContext } from './auth/AuthContext.js'
import { render } from '@testing-library/react'

describe('App routes', () => {
  it('renders the shared layout and not-found route for an unknown path', () => {
    render(
      <AuthContext.Provider value={{ user: null, logout() {} }}>
        <MemoryRouter initialEntries={['/not-a-page']}>
          <App />
        </MemoryRouter>
      </AuthContext.Provider>,
    )
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Browse gigs' }).at(-1)).toHaveAttribute('href', '/gigs')
  })
})
