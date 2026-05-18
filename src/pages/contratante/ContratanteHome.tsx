import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui'
import { AlertCircle } from 'lucide-react'

export default function ContratanteHome() {
  const { profile, company, signOut } = useAuth()
  const isApproved = company?.status === 'aprovado'

  const handlePublishJob = () => {
    if (!isApproved) return
    // TODO: navegar para /empresa/nova-vaga quando implementado
  }

  return (
    <div className="min-h-screen bg-qe-off-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-display font-bold text-qe-black">Painel da Empresa</h1>
            <p className="text-body text-qe-gray-500">Bem-vindo, {profile?.nome}</p>
          </div>
          <Button variant="ghost" onClick={signOut}>
            Sair
          </Button>
        </header>

        {!isApproved && (
          <div
            className="mb-6 flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-qe-md"
            role="status"
          >
            <AlertCircle size={22} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-semibold text-amber-900">
                Conta aguardando aprovação
              </p>
              <p className="text-[13px] text-amber-800 mt-1">
                Você não pode publicar vagas até que um administrador aprove seu cadastro.
                Status atual: <strong>{company?.status ?? 'pendente'}</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-qe-lg p-12 shadow-qe-sm border border-qe-gray-200 text-center">
          <h2 className="text-h2 font-bold mb-4">Área do Contratante</h2>
          <p className="text-body text-qe-gray-500 mb-8">
            Aqui você poderá gerenciar suas vagas e contratar extras.
          </p>
          <Button
            variant="primary"
            disabled={!isApproved}
            onClick={handlePublishJob}
            title={
              !isApproved
                ? 'Disponível após aprovação do cadastro pelo administrador'
                : undefined
            }
          >
            Publicar Vaga
          </Button>
        </div>
      </div>
    </div>
  )
}
