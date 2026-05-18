import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import CadastroEmpresaDocumentosForm from './CadastroEmpresaDocumentosForm'

/** Etapa 2 — envio de documentos (após confirmar e-mail e login) */
export default function CadastroEmpresaEtapa2Page() {
  const { user, profile, company, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!user || profile?.tipo !== 'empresa') {
      navigate('/login', { replace: true })
      return
    }
    const hasDocs =
      Array.isArray(company?.documento_url) && company.documento_url.length > 0
    if (hasDocs) {
      navigate(
        company?.status === 'aprovado' ? '/empresa' : '/empresa/aguardando',
        { replace: true }
      )
    }
  }, [loading, user, profile, company, navigate])

  if (loading || !user || profile?.tipo !== 'empresa') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-qe-off-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qe-yellow" />
      </div>
    )
  }

  return <CadastroEmpresaDocumentosForm />
}
