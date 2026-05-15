import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from '@/components/ui'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// Páginas Públicas
import LandingPage from '@/pages/LandingPage'
import ParaFreelancers from '@/pages/ParaFreelancers'
import ParaEmpresas from '@/pages/ParaEmpresas'
import LoginPage from '@/pages/auth/LoginPage'
import CadastroPage from '@/pages/auth/CadastroPage'
import StylesPage from '@/pages/styles/StylesPage'

// Páginas Privadas
import ContratanteHome from '@/pages/contratante/ContratanteHome'
import ExtrasHome from '@/pages/extras/ExtrasHome'

const AdminDashboard = () => <div className="p-8"><h1>Dashboard Admin</h1></div>

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* --- ROTAS PÚBLICAS --- */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/para-freelancers" element={<ParaFreelancers />} />
            <Route path="/para-empresas" element={<ParaEmpresas />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<CadastroPage />} />
            <Route path="/styles" element={<StylesPage />} />

            {/* --- ROTAS PRIVADAS (PROTEGIDAS) --- */}
            
            {/* Área do Contratante (Empresa) */}
            <Route 
              path="/empresa/*" 
              element={
                <ProtectedRoute allowedRole="empresa">
                  <ContratanteHome />
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
