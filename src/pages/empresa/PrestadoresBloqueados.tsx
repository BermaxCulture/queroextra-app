import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ShieldOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, Button, EmptyState, useToast } from '@/components/ui'

interface BlockedFreelancer {
  id: string
  reason: string | null
  created_at: string
  freelancers: {
    id: string
    profiles: {
      nome: string | null
      avatar_url: string | null
    } | null
  } | null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function PrestadoresBloqueados() {
  const { company } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [blocks, setBlocks] = useState<BlockedFreelancer[]>([])
  const [loading, setLoading] = useState(true)
  const [unblockingId, setUnblockingId] = useState<string | null>(null)

  useEffect(() => {
    if (company?.id) fetchBlocks(company.id)
  }, [company?.id])

  async function fetchBlocks(companyId: string) {
    setLoading(true)
    const { data, error } = await supabase
      .from('company_freelancer_blocks')
      .select('id, reason, created_at, freelancers(id, profiles(nome, avatar_url))')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      showToast('Erro ao carregar prestadores bloqueados.', 'error')
    } else {
      setBlocks((data ?? []) as unknown as BlockedFreelancer[])
    }
    setLoading(false)
  }

  async function handleUnblock(blockId: string) {
    setUnblockingId(blockId)
    const { error } = await supabase.from('company_freelancer_blocks').delete().eq('id', blockId)

    if (error) {
      showToast('Erro ao desbloquear prestador.', 'error')
    } else {
      showToast('Prestador desbloqueado.', 'success')
      setBlocks((prev) => prev.filter((b) => b.id !== blockId))
    }
    setUnblockingId(null)
  }

  return (
    <div className="min-h-screen bg-qe-bg-page">
      <header className="hidden lg:flex items-center gap-3 mb-2">
        <button
          type="button"
          onClick={() => navigate('/empresa/perfil')}
          className="flex items-center gap-1 text-[14px] text-qe-gray-600 hover:text-qe-gray-900 transition-colors"
        >
          <ChevronLeft size={16} />
          Voltar
        </button>
        <span className="text-qe-gray-200 select-none">|</span>
        <h1 className="text-[17px] font-bold text-qe-gray-900">Prestadores bloqueados</h1>
      </header>

      <p className="text-[13px] text-qe-gray-500 mb-5">
        Prestadores bloqueados não veem nem conseguem se candidatar às suas vagas. Eles não são
        avisados do bloqueio e continuam com acesso normal ao restante da plataforma.
      </p>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-qe-yellow" />
        </div>
      ) : blocks.length === 0 ? (
        <EmptyState
          icon={<ShieldOff />}
          title="Nenhum prestador bloqueado"
          description="Você pode bloquear um prestador a partir da lista de candidatos."
        />
      ) : (
        <div className="space-y-3">
          {blocks.map((block) => {
            const freelancer = block.freelancers?.profiles
            return (
              <div
                key={block.id}
                className="bg-qe-white rounded-qe-md border border-qe-gray-100 p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={freelancer?.avatar_url || undefined} name={freelancer?.nome ?? '—'} size="md" />
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-qe-gray-900 truncate">
                      {freelancer?.nome ?? 'Prestador'}
                    </p>
                    {block.reason && (
                      <p className="text-[12px] text-qe-gray-500 truncate">{block.reason}</p>
                    )}
                    <p className="text-[11px] text-qe-gray-400">Bloqueado em {formatDate(block.created_at)}</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  loading={unblockingId === block.id}
                  onClick={() => handleUnblock(block.id)}
                >
                  Desbloquear
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
