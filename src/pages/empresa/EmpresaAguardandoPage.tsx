import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, LogOut, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui'

export default function EmpresaAguardandoPage() {
  const { profile, company, loading, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (profile?.tipo !== 'empresa') {
      navigate('/login', { replace: true })
      return
    }
    const hasDocs =
      Array.isArray(company?.documento_url) && company.documento_url.length > 0
    if (!hasDocs) {
      navigate('/cadastro/empresa/documentos', { replace: true })
      return
    }
    if (company?.status === 'aprovado') {
      navigate('/empresa', { replace: true })
    }
  }, [loading, profile, company, navigate])

  if (loading || profile?.tipo !== 'empresa') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-qe-off-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qe-yellow" />
      </div>
    )
  }

  if (company?.status === 'rejeitado') {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[480px] bg-white rounded-[24px] p-10 shadow-qe-lg border border-qe-gray-100 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-qe-error-bg flex items-center justify-center">
            <XCircle size={32} className="text-qe-error" />
          </div>

          <h1 className="text-[24px] font-bold text-qe-black mb-3">Cadastro não aprovado</h1>

          <p className="text-[15px] text-qe-gray-600 leading-relaxed mb-2">
            Olá, <strong>{profile?.nome}</strong>. Após análise, não foi possível aprovar o
            cadastro da sua empresa na plataforma.
          </p>

          <p className="text-[14px] text-qe-gray-500 leading-relaxed mb-8">
            Isso pode ter ocorrido por inconsistência nos documentos enviados ou por não atender
            aos critérios da plataforma. Entre em contato com nosso suporte para mais
            informações ou para solicitar uma nova análise.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              variant="secondary"
              onClick={() => window.location.href = 'mailto:suporte@queroextra.app.br'}
            >
              Falar com o suporte
            </Button>
            <Button variant="ghost" onClick={signOut} leadingIcon={<LogOut size={18} />}>
              Sair da conta
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[480px] bg-white rounded-[24px] p-10 shadow-qe-lg border border-qe-gray-100 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-qe-yellow/20 flex items-center justify-center">
          <Clock size={32} className="text-qe-yellow-text" />
        </div>

        <h1 className="text-[24px] font-bold text-qe-black mb-3">Cadastro em análise</h1>

        <p className="text-[15px] text-qe-gray-600 leading-relaxed mb-2">
          Olá, <strong>{profile?.nome}</strong>! Recebemos seus documentos e seu cadastro está
          com status <strong className="text-qe-yellow-text">pendente</strong>.
        </p>

        <p className="text-[14px] text-qe-gray-500 leading-relaxed mb-8">
          Nossa equipe irá analisar as informações em breve. Você receberá um e-mail quando sua
          empresa for aprovada e poderá publicar vagas na plataforma.
        </p>

        {company?.area && (
          <p className="text-[13px] text-qe-gray-400 mb-8">Área: {company.area}</p>
        )}

        <Button variant="ghost" onClick={signOut} leadingIcon={<LogOut size={18} />}>
          Sair da conta
        </Button>
      </div>
    </div>
  )
}
