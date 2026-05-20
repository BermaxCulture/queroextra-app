import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  TopBar,
  Button,
  Badge,
  Avatar,
  useToast,
} from '@/components/ui'
import {
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'

interface JobDetails {
  id: string
  company_id: string
  titulo: string
  local: string | null
  valor: number
  data_inicio: string | null
  data_fim: string | null
  descricao: string | null
  categoria: string | null
  tags: string[] | null
  status: string
  urgente: boolean
  created_at: string
  companies: {
    id: string
    profiles: {
      id: string
      nome: string
      avatar_url: string | null
    }
  } | null
}

export default function VagaDetalhesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { freelancer } = useAuth()
  const { showToast } = useToast()

  const [job, setJob] = React.useState<JobDetails | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [hasApplied, setHasApplied] = React.useState(false)
  const [applying, setApplying] = React.useState(false)

  // Carregar dados da vaga e status de candidatura
  const loadJobDetails = React.useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      
      // Buscar detalhes do job
      const { data, error } = await supabase
        .from('jobs')
        .select('*, companies(id, profiles(id, nome, avatar_url))')
        .eq('id', id)
        .single()

      if (error) throw error
      setJob(data as unknown as JobDetails)

      // Se o freelancer estiver logado, verificar se ele já se candidatou
      if (freelancer?.id) {
        const { data: appData, error: appError } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', id)
          .eq('freelancer_id', freelancer.id)
          .maybeSingle()

        if (appError) throw appError
        if (appData) {
          setHasApplied(true)
        }
      }
    } catch (err: any) {
      const msg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err))
      console.error('Erro detalhado ao carregar detalhes da vaga:', err)
      showToast(`Erro ao carregar vaga: ${msg}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [id, freelancer, showToast])

  React.useEffect(() => {
    loadJobDetails()
  }, [loadJobDetails])

  // Enviar Candidatura
  const handleApply = async () => {
    if (!id || !freelancer?.id) {
      showToast('Faça login como freelancer para se candidatar.', 'error')
      return
    }

    try {
      setApplying(true)
      const { error } = await supabase
        .from('applications')
        .insert({
          job_id: id,
          freelancer_id: freelancer.id,
          status: 'pendente',
        })

      if (error) {
        // Se a constraint de unique disparar
        if (error.code === '23505') {
          setHasApplied(true)
          showToast('Você já se candidatou a esta vaga!', 'info')
          return
        }
        throw error
      }

      setHasApplied(true)
      showToast('Candidatura enviada com sucesso! ⚡', 'success')
    } catch (err: any) {
      const msg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err))
      console.error('Erro detalhado ao enviar candidatura:', err)
      showToast(`Não foi possível enviar a candidatura: ${msg}`, 'error')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-qe-bg-page flex flex-col pb-[80px]">
        <div className="bg-white border-b border-qe-gray-100 sticky top-0 z-20">
          <div className="shimmer h-14 w-full" />
        </div>
        <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-6 space-y-4">
          <div className="shimmer h-8 w-2/3 rounded-qe-md" />
          <div className="shimmer h-5 w-1/2 rounded-qe-md" />
          <div className="shimmer h-5 w-1/3 rounded-qe-md" />
          <div className="shimmer h-40 w-full rounded-qe-md mt-4" />
          <div className="shimmer h-[52px] w-full rounded-qe-pill mt-6" />
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-qe-bg-page flex flex-col">
        <TopBar variant="inner" title="Vaga não encontrada" onBack={() => navigate('/extras')} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-qe-error mb-4" />
          <h2 className="text-h2 font-bold text-qe-gray-900 mb-2">Vaga não encontrada</h2>
          <p className="text-body text-qe-gray-500 mb-6">A vaga que você procura não está mais disponível ou foi encerrada.</p>
          <Button variant="primary" onClick={() => navigate('/extras')}>Voltar para Explorar</Button>
        </div>
      </div>
    )
  }

  // Formatar período de trabalho
  const dateFormatted = job.data_inicio
    ? new Date(job.data_inicio).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'A definir'

  const timeFormatted = () => {
    if (!job.data_inicio) return 'A definir'
    const start = new Date(job.data_inicio)
    const startH = start.getHours().toString().padStart(2, '0')
    const startM = start.getMinutes().toString().padStart(2, '0')
    if (!job.data_fim) return `${startH}:${startM}`
    const end = new Date(job.data_fim)
    const endH = end.getHours().toString().padStart(2, '0')
    const endM = end.getMinutes().toString().padStart(2, '0')
    return `${startH}:${startM} às ${endH}:${endM}`
  }

  // Calcular duração do turno
  const durationHours = () => {
    if (!job.data_inicio || !job.data_fim) return 8
    const start = new Date(job.data_inicio)
    const end = new Date(job.data_fim)
    const diffMs = end.getTime() - start.getTime()
    return Math.round(diffMs / (1000 * 60 * 60))
  }

  // Logo centralizado no Header
  const headerLogo = (
    <span className="text-[16px] font-bold text-qe-gray-900 tracking-[-0.5px]">
      Quero<span className="text-qe-yellow">Extra</span>
    </span>
  )

  return (
    <div className="min-h-screen bg-qe-bg-page flex flex-col pb-[80px]">
      {/* Header com Voltar */}
      <div className="bg-white border-b border-qe-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto">
          <TopBar variant="inner" title={headerLogo} onBack={() => navigate('/extras')} />
        </div>
      </div>

      {/* Conteúdo principal */}
      <main className="flex-1 px-4 md:px-8 py-6 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Coluna Esquerda: Informações Gerais */}
        <div className="md:col-span-8 space-y-6">
          {/* Info Principal */}
          <section className="bg-white rounded-qe-md border border-qe-gray-200 p-5 space-y-3.5 shadow-qe-sm">
            <div className="flex flex-wrap gap-2 items-center">
              {job.categoria && <Badge variant="category">{job.categoria}</Badge>}
              {job.urgente && <Badge variant="urgent">Urgente</Badge>}
            </div>

            <h1 className="text-[22px] md:text-[28px] font-bold text-qe-gray-900 leading-[1.2]">
              {job.titulo}
            </h1>

            <div className="flex items-center gap-2 text-[14px] text-qe-gray-500">
              <MapPin size={16} className="text-qe-gray-400 shrink-0" />
              <span>{job.local || 'Local não informado'}</span>
            </div>

            {/* Tags de status */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="info">Início Imediato</Badge>
              {durationHours() >= 8 ? (
                <Badge variant="warning">Turno Integral</Badge>
              ) : (
                <Badge variant="pending">Turno Parcial</Badge>
              )}
            </div>
          </section>

          {/* Cards de pagamento/horário (Visíveis no mobile e desktop esquerdo) */}
          <section className="grid grid-cols-2 gap-3.5">
            <div className="bg-white rounded-qe-md border border-qe-gray-200 p-4 shadow-qe-sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-qe-gray-400 mb-1">
                PAGAMENTO BASE
              </div>
              <div className="text-[22px] font-bold text-qe-gray-900">
                R$ {job.valor.toLocaleString('pt-BR')}
              </div>
              <div className="text-[12px] text-qe-gray-400 mt-1">
                Por turno ({durationHours()}h)
              </div>
            </div>

            <div className="bg-white rounded-qe-md border border-qe-gray-200 p-4 shadow-qe-sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-qe-gray-400 mb-1">
                HORÁRIO
              </div>
              <div className="text-[14px] font-bold text-qe-gray-900 leading-tight">
                {timeFormatted()}
              </div>
              <div className="text-[12px] text-qe-gray-400 mt-2 flex items-center gap-1">
                <Calendar size={12} className="text-qe-gray-400" />
                <span className="capitalize">{dateFormatted}</span>
              </div>
            </div>
          </section>

          {/* Detalhes do Extra (Descrição e requisitos) */}
          <section className="bg-white rounded-qe-md border border-qe-gray-200 p-5 space-y-4 shadow-qe-sm">
            <div>
              <h2 className="text-[16px] font-bold text-qe-gray-900 mb-2">Detalhes do Extra</h2>
              <p className="text-[14px] text-qe-gray-600 leading-relaxed">
                {job.descricao || 'Nenhuma descrição fornecida para este extra.'}
              </p>
            </div>

            {job.tags && job.tags.length > 0 && (
              <div className="pt-3 border-t border-qe-gray-100">
                <h3 className="text-[13px] font-bold text-qe-gray-900 mb-2.5 uppercase tracking-[0.5px]">Requisitos da Vaga</h3>
                <ul className="space-y-2">
                  {job.tags.map((tag) => (
                    <li key={tag} className="flex items-center gap-2 text-[14px] text-qe-gray-600">
                      <CheckCircle2 size={16} className="text-qe-success shrink-0" />
                      <span>{tag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Card da empresa contratante */}
          <section
            role="button"
            tabIndex={0}
            onClick={() => job.companies?.id && navigate(`/extras/empresa/${job.companies.id}`)}
            onKeyDown={(e) => e.key === 'Enter' && job.companies?.id && navigate(`/extras/empresa/${job.companies.id}`)}
            className="bg-white rounded-qe-md border border-qe-gray-200 p-4 flex items-center justify-between cursor-pointer hover:border-qe-gray-300 transition-colors shadow-qe-sm"
          >
            <div className="flex items-center gap-3">
              <Avatar
                src={job.companies?.profiles.avatar_url || undefined}
                name={job.companies?.profiles.nome || 'Empresa'}
                size="md"
              />
              <div>
                <h3 className="text-[15px] font-bold text-qe-gray-900 leading-tight">
                  {job.companies?.profiles.nome || 'Empresa parceira'}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[12px] text-qe-gray-400">Ver perfil da empresa</span>
                </div>
              </div>
            </div>
            <ChevronRight size={20} className="text-qe-gray-400" />
          </section>
        </div>

        {/* Coluna Direita: Painel de Candidatura Lateral (Sticky no Desktop) */}
        <div className="hidden md:block md:col-span-4 sticky top-24">
          <div className="bg-white rounded-qe-md border border-qe-gray-200 p-6 space-y-6 shadow-qe-sm">
            <div>
              <span className="text-[11px] font-bold text-qe-gray-400 uppercase tracking-[0.5px]">Ganhos Estimados</span>
              <div className="text-[28px] font-bold text-qe-gray-900 mt-1 leading-none">
                R$ {job.valor.toLocaleString('pt-BR')}
                <span className="text-[14px] text-qe-gray-400 font-normal">/turno</span>
              </div>
              <p className="text-[12px] text-qe-gray-400 mt-2 font-medium">
                Turno de aproximadamente {durationHours()} horas.
              </p>
            </div>

            <div className="border-t border-b border-qe-gray-100 py-4 space-y-3">
              <div className="flex items-center justify-between text-[13px] font-medium text-qe-gray-600">
                <span className="text-qe-gray-400">Data do Turno</span>
                <span className="font-semibold text-qe-gray-900 capitalize">{dateFormatted}</span>
              </div>
              <div className="flex items-center justify-between text-[13px] font-medium text-qe-gray-600">
                <span className="text-qe-gray-400">Horário</span>
                <span className="font-semibold text-qe-gray-900">{timeFormatted()}</span>
              </div>
              <div className="flex items-center justify-between text-[13px] font-medium text-qe-gray-600">
                <span className="text-qe-gray-400">Categoria</span>
                <span className="font-semibold text-qe-gray-900 capitalize">{job.categoria || 'Extra'}</span>
              </div>
            </div>

            {hasApplied ? (
              <Button
                variant="secondary"
                disabled
                size="lg"
                className="w-full bg-qe-gray-100 text-qe-gray-400 border-none pointer-events-none font-bold"
              >
                Candidatura enviada ✓
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="w-full shadow-qe-sm font-bold flex items-center justify-center gap-1.5"
                onClick={handleApply}
                loading={applying}
              >
                Quero Extra! ⚡
              </Button>
            )}
          </div>
        </div>

      </main>

      {/* Rodapé fixo com candidatura (Apenas Mobile) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-qe-gray-200 px-4 py-3 flex items-center justify-between gap-4 max-w-md mx-auto z-10 md:hidden">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-qe-gray-400 font-bold uppercase tracking-[0.5px]">Total estimado</div>
          <div className="text-[20px] font-bold text-qe-gray-900 leading-tight">
            R$ {job.valor.toLocaleString('pt-BR')},00
          </div>
        </div>
        
        <div className="shrink-0 w-3/5">
          {hasApplied ? (
            <Button
              variant="secondary"
              disabled
              size="lg"
              className="w-full bg-qe-gray-100 text-qe-gray-400 border-none pointer-events-none"
            >
              Candidatura enviada ✓
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="w-full shadow-qe-sm"
              onClick={handleApply}
              loading={applying}
            >
              Quero Extra! ⚡
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
