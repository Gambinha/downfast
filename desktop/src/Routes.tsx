import { ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Cadastro from './pages/Cadastro'
import Home from './pages/Home'
import Library from './pages/Library'
import Settings from './pages/Settings'

import { UserProvider } from './contexts/userData'
import { useAuthInterceptor } from './hooks/useAuthInterceptor'

function AuthInterceptorSetup({ children }: { children: ReactNode }) {
  useAuthInterceptor();
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <UserProvider>
        <AuthInterceptorSetup>
          <Routes>
            <Route path="/" element={<Cadastro />} />
            <Route path="/home" element={<Home />} />
            <Route path="/library" element={<Library />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AuthInterceptorSetup>
      </UserProvider>
    </BrowserRouter>
  )
}

export default AppRoutes
