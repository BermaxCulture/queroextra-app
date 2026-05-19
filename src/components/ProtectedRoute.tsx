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

  // 1. Se não está logado (e terminou de carregar a checagem inicial), vai para o login
  if (!loading && !user) {
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  // 2. Se o usuário estiver autenticado (JWT disponível)
  if (user) {
    const tipo = user.user_metadata?.tipo || profile?.tipo

    // Se o papel exigido for diferente do tipo do usuário, redireciona para a respectiva Home
    if (allowedRole && tipo && tipo !== allowedRole) {
      const homeMap = {
        freelancer: '/app',
        empresa: '/empresa',
        admin: '/admin'
      }
      const home = homeMap[tipo as 'freelancer' | 'empresa' | 'admin'] || '/'
      return <Navigate to={home} replace />
    }

    // Se o tipo do usuário já bate com o papel exigido, renderiza os filhos imediatamente
    if (tipo && tipo === allowedRole) {
      return <>{children}</>
    }
  }

  // 3. Se a sessão inicial do Supabase ainda estiver carregando
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-qe-off-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qe-yellow"></div>
      </div>
    )
  }

  return <>{children}</>
}
