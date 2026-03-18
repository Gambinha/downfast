import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { UserContext, userContextDefaultValueProps } from '../../contexts/userData'

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  username: 'testuser',
  likedsPlaylists: [],
  role: 'ROLE_USER',
}

function renderNavbar(page = 1) {
  return render(
    <MemoryRouter>
      <UserContext.Provider value={{
        ...userContextDefaultValueProps,
        userData: mockUser,
      }}>
        <Navbar page={page} page_title="Home" />
      </UserContext.Provider>
    </MemoryRouter>
  )
}

describe('Navbar', () => {
  it('renders page title', () => {
    renderNavbar()
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
  })

  it('renders username and email', () => {
    renderNavbar()
    expect(screen.getAllByText('testuser').length).toBeGreaterThan(0)
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('renders only v1 routes in sidebar (Home, Library, Settings)', () => {
    renderNavbar()
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0)
    expect(screen.getByText('Library')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    // Should NOT have Studio, Feed, or Admin routes
    expect(screen.queryByText('Studio')).not.toBeInTheDocument()
    expect(screen.queryByText('Feed')).not.toBeInTheDocument()
    expect(screen.queryByText('Usuários')).not.toBeInTheDocument()
  })
})
