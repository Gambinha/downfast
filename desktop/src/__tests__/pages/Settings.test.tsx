import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Settings from '../../pages/Settings'
import { UserContext, userContextDefaultValueProps } from '../../contexts/userData'
import { updateApiBaseUrl } from '../../services/api'

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  username: 'testuser',
  likedsPlaylists: [],
  role: 'ROLE_USER',
}

function renderSettings() {
  return render(
    <MemoryRouter>
      <UserContext.Provider value={{
        ...userContextDefaultValueProps,
        userData: mockUser,
      }}>
        <Settings />
      </UserContext.Provider>
    </MemoryRouter>
  )
}

describe('Settings', () => {
  it('renders user profile data', () => {
    renderSettings()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getAllByText('testuser').length).toBeGreaterThan(0)
    expect(screen.getAllByText('test@example.com').length).toBeGreaterThan(0)
  })

  it('renders server URL configuration section', () => {
    renderSettings()
    expect(screen.getByText('Configurações do Servidor')).toBeInTheDocument()
    expect(screen.getByText('URL do Servidor:')).toBeInTheDocument()
  })

  it('saves server URL when clicking save button', async () => {
    renderSettings()

    const urlInput = screen.getByPlaceholderText('http://localhost:3333')
    fireEvent.change(urlInput, { target: { value: 'http://192.168.1.100:3333' } })

    const saveButton = screen.getByText('Salvar URL')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(updateApiBaseUrl).toHaveBeenCalledWith('http://192.168.1.100:3333')
    })
  })

  it('switches to edit profile mode', () => {
    renderSettings()
    const editButton = screen.getByText('Editar Perfil')
    fireEvent.click(editButton)
    expect(screen.getByText('Salvar Alterações')).toBeInTheDocument()
  })
})
