import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Badge,
  Button,
  EmptyState,
  useToast,
} from '@/components/ui'
import {
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Coffee,
  GlassWater,
  Sparkles,
} from 'lucide-react'

interface Application {
  id: string
  job_id: string
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'em_andamento' | 'concluido' | 'cancelado'
  created_at: string
  jobs: {
    titulo: string
    valor: number
    local: string | null
    data_inicio: string | null
    data_fim: string | null
    categoria: string | null
    companies: {
      profiles: {
        nome: string
      }
    } | null
  } | null
}

type TabStatus = 'pendente' | 'aprovado' | 'em_andamento' | 'concluido'

export default function MeusExtrasPage() {
  const { freelancer } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = React.useState<TabStatus>('pendente')
  const [applications, setApplications] = React.useState<Application[]>([])
  const [loading, setLoading] = React.useState(true)

  // Carregar candidaturas baseado na aba ativa
  const fetchApplications = React.useCallback(async () => {
    if (!freelancer?.id) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          job_id,
          status,
          created_at,
          jobs (
            titulo,
            valor,
            local,
            data_inicio,
            data_fim,
            categoria,
            companies (
              profiles (
                nome
              )
            )
          )
        `)
        .eq('freelancer_id', freelancer.id)
        .eq('status', activeTab)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications((data as unknown as Application[]) || [])
    } catch (err: any) {
      const msg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err))
      console.error('Erro detalhado ao buscar candidaturas:', err)
      showToast(`Erro ao carregar candidaturas: ${msg}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [freelancer, activeTab, showToast])

  React.useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  // Inscrição em Tempo Real via Supabase Realtime
  React.useEffect(() => {
    if (!freelancer?.id) return

    const channel = supabase
      .channel(`realtime-applications-${freelancer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `freelancer_id=eq.${freelancer.id}`,
        },
        (payload) => {
          console.log('[Realtime] Alteração em candidatura detectada:', payload)
          // Recarregar os dados na tela
          fetchApplications()
          showToast('Status de candidatura atualizado em tempo real! ⚡', 'info')
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [freelancer?.id, fetchApplications, showToast])

  // Formatação de data
  const formatJobDate = (dateStr: string | null) => {
    if (!dateStr) return 'A definir'
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  // Formatação de horário
  const formatJobTime = (startStr: string | null, endStr: string | null) => {
    if (!startStr) return 'A definir'
    const start = new Date(startStr)
    const startH = start.getHours().toString().padStart(2, '0')
    const startM = start.getMinutes().toString().padStart(2, '0')
    if (!endStr) return `${startH}:${startM}`
    const end = new Date(endStr)
    const endH = end.getHours().toString().padStart(2, '0')
    const endM = end.getMinutes().toString().padStart(2, '0')
    return `${startH}:${startM} — ${endH}:${endM}`
  }

  // Retorna ícone correspondente à categoria
  const getCategoryIcon = (category: string | null) => {
    const cat = category?.toLowerCase() || ''
    if (cat.includes('garço') || cat.includes('atend')) return <Coffee className="w-5 h-5 text-qe-gray-500" />
    if (cat.includes('bar') || cat.includes('drink')) return <GlassWater className="w-5 h-5 text-qe-gray-500" />
    return <Briefcase className="w-5 h-5 text-qe-gray-500" />
  };

  // Badges estilizados por status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge variant="confirmed">Confirmado</Badge>
      case 'em_andamento':
        return <Badge variant="warning">Em Andamento</Badge>
      case 'concluido':
        return <Badge variant="info">Finalizado</Badge>
      case 'rejeitado':
        return <Badge variant="urgent">Recusado</Badge>
      case 'cancelado':
        return <Badge variant="urgent">Cancelado</Badge>
      default:
        return <Badge variant="pending">Pendente</Badge>
    }
  }

  const getEmptyStateMessage = (status: TabStatus) => {
    switch (status) {
      case 'aprovado':
        return 'Não há extras confirmados no momento.'
      case 'em_andamento':
        return 'Não há extras em andamento no momento.'
      case 'concluido':
        return 'Não há extras finalizados no momento.'
      default:
        return 'Não há extras pendentes no momento.'
    }
  }

  const tabs: { label: string; value: TabStatus }[] = [
    { label: 'Pendentes', value: 'pendente' },
    { label: 'Confirmados', value: 'aprovado' },
    { label: 'Em andamento', value: 'em_andamento' },
    { label: 'Finalizados', value: 'concluido' },
  ]

  return (
    <div className="pb-24 bg-qe-bg-page min-h-screen">
      {/* Header Fixo */}
      <header className="bg-white border-b border-qe-gray-100 px-4 md:px-8 py-5 sticky top-0 z-10 shadow-qe-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-[20px] font-bold text-qe-gray-900">Meus Extras</h1>
          <p className="text-[13px] text-qe-gray-400 mt-1">
            Acompanhe e gerencie seus trabalhos agendados.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 mt-6 space-y-6">
        {/* Abas horizontais deslizáveis */}
        <div className="flex border-b border-qe-gray-200 overflow-x-auto scrollbar-none gap-2 py-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={[
                'px-4 py-2 text-[14px] font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer',
                activeTab === tab.value
                  ? 'border-qe-yellow text-qe-gray-900'
                  : 'border-transparent text-qe-gray-400 hover:text-qe-gray-600',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Listagem */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-[140px] bg-white border border-qe-gray-200 rounded-qe-md animate-pulse"
              ></div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="pt-8">
            <EmptyState
              icon={<Sparkles className="w-12 h-12 text-qe-gray-300" />}
              title="Nada por aqui"
              description={getEmptyStateMessage(activeTab)}
              action={
                activeTab === 'pendente' && (
                  <Button variant="primary" onClick={() => navigate('/app/explorar')}>
                    Explorar Extras
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-qe-md border border-qe-gray-200 p-4 flex flex-col justify-between hover:border-qe-gray-300 transition-colors shadow-qe-sm"
              >
                {/* Topo do Card */}
                <div className="flex justify-between items-start gap-2 mb-3">
                  {getStatusBadge(app.status)}
                  <div className="text-right text-[12px] text-qe-gray-500 font-medium">
                    <div className="flex items-center gap-1 justify-end font-semibold text-qe-gray-950">
                      <Calendar size={13} className="text-qe-gray-400" />
                      <span className="capitalize">{formatJobDate(app.jobs?.data_inicio || null)}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-0.5 text-qe-gray-400">
                      <Clock size={13} />
                      <span>{formatJobTime(app.jobs?.data_inicio || null, app.jobs?.data_fim || null)}</span>
                    </div>
                  </div>
                </div>

                {/* Corpo do Card */}
                <div className="flex items-start gap-3.5 mb-4">
                  <div className="w-10 h-10 bg-qe-gray-50 border border-qe-gray-100 rounded-qe-sm flex items-center justify-center shrink-0">
                    {getCategoryIcon(app.jobs?.categoria || null)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-bold text-qe-gray-900 leading-snug truncate">
                      {app.jobs?.titulo || 'Vaga de Extra'}
                    </h3>
                    <p className="text-[13px] text-qe-gray-400 font-medium flex items-center gap-1 mt-1 truncate">
                      <MapPin size={13} className="shrink-0 text-qe-gray-300" />
                      <span>
                        {app.jobs?.companies?.profiles?.nome || 'Estabelecimento'} ·{' '}
                        {app.jobs?.local || 'Local não informado'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Rodapé do Card */}
                <div className="flex items-center justify-between pt-3.5 border-t border-qe-gray-100">
                  <div>
                    <span className="text-[10px] font-bold text-qe-gray-400 uppercase tracking-[0.5px]">Valor estimado</span>
                    <div className="text-[18px] font-bold text-qe-gray-900 leading-tight">
                      R$ {Number(app.jobs?.valor || 0).toLocaleString('pt-BR')}
                      <span className="text-[11px] text-qe-gray-400 font-normal">/turno</span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1 font-semibold text-[13px] px-3.5"
                    onClick={() => navigate(`/app/vaga/${app.job_id}`)}
                  >
                    Ver Detalhes
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
