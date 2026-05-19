import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastProvider } from '@/components/ui'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { GuestRoute } from '@/components/GuestRoute'

// Páginas Públicas
import LandingPage from '@/pages/LandingPage'
import ParaFreelancers from '@/pages/ParaFreelancers'
import ParaEmpresas from '@/pages/ParaEmpresas'
import LoginPage from '@/pages/auth/LoginPage'
import CadastroPage from '@/pages/auth/CadastroPage'
import CadastroEmpresaEtapa1Page from '@/pages/auth/CadastroEmpresaEtapa1Page'
import CadastroEmpresaEtapa2Page from '@/pages/auth/CadastroEmpresaEtapa2Page'
import EmpresaAguardandoPage from '@/pages/empresa/EmpresaAguardandoPage'
import { EmpresaRouteGuard } from '@/components/empresa/EmpresaRouteGuard'
import StylesPage from '@/pages/styles/StylesPage'
import TermosDeUso from '@/pages/TermosDeUso'
import Privacidade from '@/pages/Privacidade'

// Páginas Privadas
import ContratanteHome from '@/pages/contratante/ContratanteHome'
import ExtrasHome from '@/pages/extras/ExtrasHome'

const AdminDashboard = () => <div className="p-8"><h1>Dashboard Admin</h1></div>

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* --- ROTAS PÚBLICAS --- */}
            <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
            <Route path="/para-freelancers" element={<GuestRoute><ParaFreelancers /></GuestRoute>} />
            <Route path="/para-empresas" element={<GuestRoute><ParaEmpresas /></GuestRoute>} />
            
            {/* Login e Cadastro protegidos para convidados apenas */}
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/cadastro" element={<GuestRoute><CadastroPage /></GuestRoute>} />
            <Route path="/cadastro/empresa" element={<GuestRoute><CadastroEmpresaEtapa1Page /></GuestRoute>} />
            <Route
              path="/cadastro/empresa/documentos"
              element={
                <GuestRoute>
                  <CadastroEmpresaEtapa2Page />
                </GuestRoute>
              }
            />
            
            <Route path="/styles" element={<StylesPage />} />
            <Route path="/termos" element={<TermosDeUso />} />
            <Route path="/privacidade" element={<Privacidade />} />

            {/* --- ROTAS PRIVADAS (PROTEGIDAS) --- */}
            
            {/* Empresa — aguardando aprovação (documentos já enviados) */}
            <Route
              path="/empresa/aguardando"
              element={
                <ProtectedRoute allowedRole="empresa">
                  <EmpresaAguardandoPage />
                </ProtectedRoute>
              }
            />

            {/* Área do Contratante (Empresa aprovada) */}
            <Route
              path="/empresa/*"
              element={
                <ProtectedRoute allowedRole="empresa">
                  <EmpresaRouteGuard>
                    <ContratanteHome />
                  </EmpresaRouteGuard>
                </ProtectedRoute>
              }
            />

            {/* Área dos Extras (Freelancer) */}
            <Route 
              path="/app/*" 
              element={
                <ProtectedRoute allowedRole="freelancer">
                  <ExtrasHome />
                </ProtectedRoute>
              } 
            />

            {/* Área Administrativa */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Fallback: Se não encontrar a rota, volta para a Landing Page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
