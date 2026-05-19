import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface GuestRouteProps {
  children: React.ReactNode
}

export const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { user, profile, loading } = useAuth()

  console.log(
    `[GuestRoute] Diagnóstico — loading: ${loading}, hasUser: ${!!user}, userMetadataTipo: ${user?.user_metadata?.tipo}, profileTipo: ${profile?.tipo}`
  )

  // Se o usuário estiver autenticado, redireciona imediatamente para a respectiva Home
  if (user) {
    const tipo = user.user_metadata?.tipo || profile?.tipo
    if (tipo) {
      const homeMap = {
        freelancer: '/app',
        empresa: '/empresa',
        admin: '/admin',
      }
      const home = homeMap[tipo as 'freelancer' | 'empresa' | 'admin'] || '/'
      return <Navigate to={home} replace />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-qe-off-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qe-yellow"></div>
      </div>
    )
  }

  return <>{children}</>
}
