import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRole?: 'freelancer' | 'empresa' | 'admin'
  loginPath?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole, loginPath = '/login' }) => {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  console.log(
    `[ProtectedRoute] Diagnóstico — pathname: ${location.pathname}, allowedRole: ${allowedRole}, loading: ${loading}, hasUser: ${!!user}, userMetadataTipo: ${user?.user_metadata?.tipo}, profileTipo: ${profile?.tipo}`
  )

  // 1. Aguarda o carregamento completo antes de qualquer decisão de role
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-qe-off-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qe-yellow"></div>
      </div>
    )
  }

  // 2. Sem sessão ativa → redireciona para login
  if (!user) {
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  // 3. Usa o DB como fonte autoritativa; JWT metadata apenas como fallback (race condition de cadastro)
  const tipo = profile?.tipo || user.user_metadata?.tipo

  // 4. Role errado → redireciona para a home correta
  if (allowedRole && tipo && tipo !== allowedRole) {
    const homeMap = {
      freelancer: '/app',
      empresa: '/empresa',
      admin: '/admin',
    }
    const home = homeMap[tipo as 'freelancer' | 'empresa' | 'admin'] || '/'
    return <Navigate to={home} replace />
  }

  return <>{children}</>
}
