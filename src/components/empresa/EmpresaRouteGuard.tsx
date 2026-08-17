import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface EmpresaRouteGuardProps {
  children: React.ReactNode
  /** Permite acesso mesmo com status pendente (ex.: envio de documentos) */
  allowPending?: boolean
  /** Exige documentos já enviados */
  requireDocuments?: boolean
}

export function EmpresaRouteGuard({
  children,
  allowPending = false,
  requireDocuments = false,
}: EmpresaRouteGuardProps) {
  const { user, profile, company, loading } = useAuth()
  const location = useLocation()

  const tipo = profile?.tipo ?? user?.user_metadata?.tipo

  // Aguarda dados transientes: AuthContext inicializando, profile ou company ainda carregando
  if (loading || (user && !profile) || (tipo === 'empresa' && !company)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-qe-off-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qe-yellow" />
      </div>
    )
  }

  if (!user || tipo !== 'empresa') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const hasDocs = Array.isArray(company?.documento_url) && company.documento_url.length > 0

  if (requireDocuments && !hasDocs) {
    return <Navigate to="/cadastro/empresa/documentos" replace />
  }

  if (!allowPending) {
    if (company?.status === 'aprovado') {
      // aprovada: acesso liberado independente de hasDocs
    } else if (!hasDocs) {
      return <Navigate to="/cadastro/empresa/documentos" replace />
    } else {
      return <Navigate to="/empresa/aguardando" replace />
    }
  }

  return <>{children}</>
}
