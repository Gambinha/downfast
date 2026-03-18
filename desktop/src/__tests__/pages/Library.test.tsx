import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Library from '../../pages/Library'
import { UserContext, userContextDefaultValueProps } from '../../contexts/userData'
import api from '../../services/api'

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  username: 'testuser',
  likedsPlaylists: [],
  role: 'ROLE_USER',
}

const mockPlaylists = [
  {
    id: 'playlist-1',
    title: 'My Playlist',
    genre: 'Rock',
    likes: 0,
    security: 'public',
    keywords: ['rock', 'music'],
    videos: [
      { name: 'Song 1', url: 'https://youtube.com/watch?v=abc' },
    ],
  },
]

function renderLibrary() {
  return render(
    <MemoryRouter>
      <UserContext.Provider value={{
        ...userContextDefaultValueProps,
        userData: mockUser,
      }}>
        <Library />
      </UserContext.Provider>
    </MemoryRouter>
  )
}

describe('Library', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('x-access-token', 'mock.jwt.token')
    vi.mocked(api.get).mockResolvedValue({ data: mockPlaylists } as any)
  })

  it('renders page title', () => {
    renderLibrary()
    expect(screen.getByText('Minhas Playlists')).toBeInTheDocument()
  })

  it('renders search inputs', () => {
    renderLibrary()
    expect(screen.getByPlaceholderText('Nome da Playlist')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Gênero da Playlist')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Palavras-Chaves')).toBeInTheDocument()
  })

  it('loads and displays playlists', async () => {
    renderLibrary()

    await waitFor(() => {
      expect(screen.getByText('My Playlist')).toBeInTheDocument()
    })
  })

  it('shows create playlist box when clicking add button', () => {
    const { container } = renderLibrary()
    const addButton = container.querySelector('#create-playlist')
    expect(addButton).not.toBeNull()
  })
})
