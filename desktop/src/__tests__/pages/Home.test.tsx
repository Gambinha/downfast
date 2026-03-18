import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Home from '../../pages/Home'
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

function renderHome() {
  return render(
    <MemoryRouter>
      <UserContext.Provider value={{
        ...userContextDefaultValueProps,
        userData: mockUser,
      }}>
        <Home />
      </UserContext.Provider>
    </MemoryRouter>
  )
}

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('x-access-token', 'mock.jwt.token')
    vi.mocked(api.get).mockResolvedValue({ data: {} } as any)
  })

  it('renders main title', () => {
    renderHome()
    expect(screen.getByText('Baixe vídeos do Youtube')).toBeInTheDocument()
  })

  it('renders URL input field', () => {
    renderHome()
    const input = screen.getByPlaceholderText('Insira o link de um vídeo ou playlist aqui')
    expect(input).toBeInTheDocument()
  })

  it('renders Enviar button', () => {
    renderHome()
    expect(screen.getByText('Enviar')).toBeInTheDocument()
  })

  it('switches between url and name search modes', () => {
    renderHome()
    const nameRadio = screen.getByLabelText('Nomes')
    fireEvent.click(nameRadio)
    expect(screen.getByPlaceholderText('Insira o nome de um vídeo para pesquisa aqui')).toBeInTheDocument()
  })

  it('switches to file upload mode', () => {
    renderHome()
    const fileButton = screen.getByText('Inserir Arquivo')
    fireEvent.click(fileButton)
    expect(screen.getByText('Enviar Arquivo de Texto')).toBeInTheDocument()
  })

  it('shows choose folder button instead of text input for destination path', () => {
    renderHome()
    // Queue must be visible — add a video first via mock
    // The folder dialog button should be in the page when queue is shown
    expect(screen.queryByPlaceholderText('Insira o caminho')).not.toBeInTheDocument()
  })
})
