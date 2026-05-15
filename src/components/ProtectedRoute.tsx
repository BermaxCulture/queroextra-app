import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRole?: 'freelancer' | 'empresa' | 'admin'
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-qe-off-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qe-yellow"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se um papel específico é exigido e o perfil não bate
  if (allowedRole && profile?.tipo !== allowedRole) {
    // Redireciona para a home correta baseada no perfil real dele
    const homeMap = {
      freelancer: '/app',
      empresa: '/empresa',
      admin: '/admin'
    }
    const home = profile?.tipo ? homeMap[profile.tipo] : '/'
    return <Navigate to={home} replace />
  }

  return <>{children}</>
}
