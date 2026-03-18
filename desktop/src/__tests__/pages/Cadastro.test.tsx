import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Cadastro from '../../pages/Cadastro'
import { UserProvider } from '../../contexts/userData'

function renderCadastro() {
  return render(
    <MemoryRouter>
      <UserProvider>
        <Cadastro />
      </UserProvider>
    </MemoryRouter>
  )
}

describe('Cadastro', () => {
  it('renders registration form by default', () => {
    renderCadastro()
    expect(screen.getByText('Cadastre-se')).toBeInTheDocument()
  })

  it('toggles to login form when clicking the login button', () => {
    renderCadastro()
    const loginButton = screen.getByText(/Já está cadastrado/i)
    fireEvent.click(loginButton)
    expect(screen.getByText('Entrar no Downfast')).toBeVisible()
  })

  it('shows validation warning when submitting empty registration form', async () => {
    renderCadastro()
    const submitButton = screen.getByText('Cadastrar')
    fireEvent.click(submitButton)
    expect(screen.getByText('*Campo não inserido!')).toBeVisible()
  })

  it('shows password mismatch warning', () => {
    renderCadastro()

    fireEvent.change(screen.getByPlaceholderText('Nome Completo'), { target: { value: 'Test User' } })
    fireEvent.change(screen.getAllByPlaceholderText('Email')[0], { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } })
    fireEvent.change(screen.getAllByPlaceholderText('Senha')[0], { target: { value: 'password123' } })
    fireEvent.change(screen.getByPlaceholderText('Repetir Senha'), { target: { value: 'different123' } })

    const submitButton = screen.getByText('Cadastrar')
    fireEvent.click(submitButton)

    expect(screen.getByText('*Senhas incompatíveis!')).toBeVisible()
  })
})
