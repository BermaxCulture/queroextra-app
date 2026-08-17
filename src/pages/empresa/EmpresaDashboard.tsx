import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  StatCard,
  Avatar,
  Badge,
  Button,
  useToast,
  EmptyState,
  ResponsiveSheet,
  SkeletonCard,
} from '@/components/ui'
import {
  Star,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  Shield,
  ChefHat,
  Wine,
  UserCheck,
  Briefcase,
  AlertCircle,
  Check,
  X,
  Phone,
  ClipboardList,
} from 'lucide-react'
import { ReviewModal } from '@/components/ReviewModal/ReviewModal'
import { usePendingReviews } from '@/hooks/useReviews'
import type { PendingReview } from '@/hooks/useReviews'

// Interfaces
interface FreelancerProfile {
  id: string
  nome: string
  avatar_url: string | null
  celular: string | null
  email: string | null
}

interface ApplicationWithFreelancer {
  id: string
  status: 'pendente' | 'aprovado' | 'rejeitado'
  freelancers: {
    id: string
    profiles: FreelancerProfile
  } | null
}

interface Job {
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
  status: 'aberta' | 'em_andamento' | 'finalizada' | 'cancelada'
  urgente: boolean
  created_at: string
  applications?: ApplicationWithFreelancer[]
  reviews?: {
    id: string
    nota: number
    comentario: string | null
  }[]
}

export default function EmpresaDashboard() {
  const { company } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = React.useState(true)
  const [kpis, setKpis] = React.useState({
    activeJobs: 0,
    totalCandidates: 0,
    finishedJobs: 0,
    avgRating: '0.0',
  })
  const [activeJobs, setActiveJobs] = React.useState<Job[]>([])
  const [latestFinished, setLatestFinished] = React.useState<Job[]>([])
  
  // Pending reviews
  const { reviews: pendingReviews, refresh: refreshReviews } = usePendingReviews(company?.profile_id)
  const [activeReview,     setActiveReview]     = React.useState<PendingReview | null>(null)
  const [reviewModalOpen,  setReviewModalOpen]  = React.useState(false)

  const openReview = (review: PendingReview) => { setActiveReview(review); setReviewModalOpen(true) }
  const closeReview = () => { setReviewModalOpen(false) }
  const handleReviewDone = () => { setReviewModalOpen(false); refreshReviews() }

  // Estados para Modal de Confirmação de Aprovação (MVP sem Stripe)
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false)
  const [confirmAppId, setConfirmAppId] = React.useState<string | null>(null)
  const [confirmFreelancerName, setConfirmFreelancerName] = React.useState('')
  const [confirmFreelancerPhone, setConfirmFreelancerPhone] = React.useState<string | null>(null)
  const [isActionLoading, setIsActionLoading] = React.useState(false)

  // Recarregar os dados do painel
  const loadDashboardData = React.useCallback(async () => {
    if (!company?.id) return
    try {
      setLoading(true)

      // 1. Buscar TODAS as vagas da empresa (para calcular os KPIs de ativos e finalizados)
      const { data: allJobs, error: allJobsErr } = await supabase
        .from('jobs')
        .select('id, status, applications(id, status)')
        .eq('company_id', company.id)

      if (allJobsErr) throw allJobsErr

      const activeJobsCount = allJobs.filter(
        (j) => j.status === 'aberta' || j.status === 'em_andamento'
      ).length
      
      const finishedJobsCount = allJobs.filter((j) => j.status === 'finalizada').length
      
      const totalCandidatesCount = allJobs.reduce(
        (acc, j) => acc + (j.applications ? j.applications.filter((a: any) => a.status !== 'cancelado').length : 0),
        0
      )

      // 2. Buscar avaliação média da empresa (apenas reviews enviadas)
      const { data: reviews, error: revErr } = await supabase
        .from('reviews')
        .select('nota')
        .eq('avaliado_id', company.profile_id)
        .eq('status', 'enviada')

      if (revErr) throw revErr

      const avg =
        reviews && reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + r.nota, 0) / reviews.length).toFixed(1)
          : '0.0'

      setKpis({
        activeJobs: activeJobsCount,
        totalCandidates: totalCandidatesCount,
        finishedJobs: finishedJobsCount,
        avgRating: avg,
      })

      // 3. Buscar "Vagas em Andamento" (aberta ou em_andamento)
      const { data: activeJobsData, error: activeErr } = await supabase
        .from('jobs')
        .select(`
          *,
          applications(
            id,
            status,
            freelancers(
              id,
              profiles(
                id,
                nome,
                avatar_url,
                celular,
                email
              )
            )
          )
        `)
        .eq('company_id', company.id)
        .in('status', ['aberta', 'em_andamento'])
        .order('created_at', { ascending: false })

      if (activeErr) throw activeErr
      setActiveJobs((activeJobsData as unknown as Job[]) || [])

      // 4. Buscar últimas 3 vagas finalizadas
      const { data: finishedData, error: finErr } = await supabase
        .from('jobs')
        .select(`
          *,
          applications(
            id,
            status,
            freelancers(
              id,
              profiles(
                id,
                nome,
                avatar_url
              )
            )
          ),
          reviews(
            id,
            nota,
            comentario,
            avaliado_id
          )
        `)
        .eq('company_id', company.id)
        .eq('status', 'finalizada')
        .order('created_at', { ascending: false })
        .limit(2)

      if (finErr) throw finErr
      setLatestFinished((finishedData as unknown as Job[]) || [])

    } catch (err: any) {
      console.error('[Dashboard] Erro ao buscar dados:', err)
      showToast('Não foi possível carregar os dados do painel.', 'error')
    } finally {
      setLoading(false)
    }
  }, [company, showToast])

  React.useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Inscrição em Tempo Real (Supabase Realtime)
  React.useEffect(() => {
    if (!company?.id) return

    // Canal para escutar mudanças nas vagas
    const jobsChannel = supabase
      .channel(`realtime-company-jobs-${company.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `company_id=eq.${company.id}`,
        },
        () => {
          console.log('[Realtime] Vagas atualizadas')
          loadDashboardData()
        }
      )
      .subscribe()

    // Canal para escutar mudanças nas candidaturas
    const appsChannel = supabase
      .channel(`realtime-company-apps-${company.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
        },
        () => {
          console.log('[Realtime] Candidaturas atualizadas')
          loadDashboardData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(jobsChannel)
      supabase.removeChannel(appsChannel)
    }
  }, [company?.id, loadDashboardData])

  // Gatilho de Aprovação Rápida (Abra o Modal)
  const triggerApprove = (appId: string, freelancerName: string, phone: string | null) => {
    setConfirmAppId(appId)
    setConfirmFreelancerName(freelancerName)
    setConfirmFreelancerPhone(phone)
    setIsConfirmOpen(true)
  }

  // Confirmar Aprovação
  const confirmApprove = async () => {
    if (!confirmAppId) return
    try {
      setIsActionLoading(true)

      const { error } = await supabase
        .from('applications')
        .update({ status: 'aprovado' })
        .eq('id', confirmAppId)

      if (error) throw error

      showToast(`Candidato ${confirmFreelancerName} aprovado com sucesso!`, 'success')
      setIsConfirmOpen(false)
      loadDashboardData()
    } catch (err: any) {
      console.error('Erro ao aprovar candidato:', err)
      showToast('Erro ao aprovar candidato.', 'error')
    } finally {
      setIsActionLoading(false)
    }
  }

  // Rejeitar Candidato
  const handleReject = async (appId: string, freelancerName: string) => {
    if (!window.confirm(`Tem certeza que deseja recusar o candidato ${freelancerName}?`)) return
    try {
      setLoading(true)

      const { error } = await supabase
        .from('applications')
        .update({ status: 'rejeitado' })
        .eq('id', appId)

      if (error) throw error

      showToast(`Candidato ${freelancerName} recusado.`, 'info')
      loadDashboardData()
    } catch (err: any) {
      console.error('Erro ao rejeitar candidato:', err)
      showToast('Erro ao recusar candidato.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Helpers de formatação
  const getCategoryIcon = (category: string | null) => {
    const cat = category?.toLowerCase() || ''
    if (cat.includes('garço') || cat.includes('atend'))
      return <UserCheck className="w-5 h-5 text-qe-yellow-text" />
    if (cat.includes('bar') || cat.includes('drink'))
      return <Wine className="w-5 h-5 text-qe-yellow-text" />
    if (cat.includes('coz') || cat.includes('aux'))
      return <ChefHat className="w-5 h-5 text-qe-yellow-text" />
    if (cat.includes('seg') || cat.includes('vig'))
      return <Shield className="w-5 h-5 text-qe-yellow-text" />
    if (cat.includes('recep') || cat.includes('host'))
      return <UserCheck className="w-5 h-5 text-qe-yellow-text" />
    return <Briefcase className="w-5 h-5 text-qe-yellow-text" />
  }

  const formatJobDate = (dateStr: string | null) => {
    if (!dateStr) return 'A definir'
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  const formatJobTime = (startStr: string | null, endStr: string | null) => {
    if (!startStr) return 'A definir'
    const start = new Date(startStr)
    const startH = start.getHours().toString().padStart(2, '0')
    const startM = start.getMinutes().toString().padStart(2, '0')
    if (!endStr) return `${startH}:${startM}`
    const end = new Date(endStr)
    const endH = end.getHours().toString().padStart(2, '0')
    const endM = end.getMinutes().toString().padStart(2, '0')
    return `${startH}:${startM} às ${endH}:${endM}`
  }

  // Determinar se é Diária ou Fim de Semana
  const getJobType = (startStr: string | null) => {
    if (!startStr) return 'Diária'
    const date = new Date(startStr)
    const day = date.getDay() // 0 = Domingo, 5 = Sexta, 6 = Sábado
    if (day === 0 || day === 5 || day === 6) {
      return 'Fim de Semana'
    }
    return 'Diária'
  }

  // Coletar todos os candidatos pendentes de aprovação rápida
  const pendingCandidates = React.useMemo(() => {
    return activeJobs.flatMap((job) => {
      const pendingApps = (job.applications || []).filter((app) => app.status === 'pendente')
      return pendingApps.map((app) => ({
        id: app.id,
        jobId: job.id,
        jobTitle: job.titulo,
        freelancerId: app.freelancers?.id,
        name: app.freelancers?.profiles?.nome || 'Prestador',
        avatar: app.freelancers?.profiles?.avatar_url,
        celular: app.freelancers?.profiles?.celular,
      }))
    })
  }, [activeJobs])

  return (
    <div className="space-y-8">
      {/* Grade de KPIs no topo */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer h-24 rounded-qe-md" />
          ))
        ) : (
          <>
            <StatCard label="Vagas Ativas" value={kpis.activeJobs} subtext="Em andamento ou abertas" />
            <StatCard label="Candidatos Totais" value={kpis.totalCandidates} subtext="Histórico acumulado" />
            <StatCard label="Concluídas" value={kpis.finishedJobs} subtext="Finalizadas com sucesso" />
            <StatCard
              label="Avaliação Média"
              value={kpis.avgRating}
              subtext="Nota dada por freelancers"
              icon={<Star size={16} fill="var(--qe-yellow)" className="text-qe-yellow" />}
            />
          </>
        )}
      </section>

      {/* Conteúdo Principal em duas colunas no Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Coluna Esquerda: Vagas em Andamento */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-h2 font-bold text-qe-gray-900">Vagas em Andamento</h2>
              <p className="text-[13px] text-qe-gray-400 mt-0.5">
                Vagas ativas que estão abertas para candidatura ou em execução.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/empresa/vagas')}
              className="text-[12px] font-bold text-qe-yellow-text hover:underline cursor-pointer"
            >
              Ver todas
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : activeJobs.length === 0 ? (
            <EmptyState
              icon={<Sparkles size={40} className="text-qe-gray-300" />}
              title="Nenhuma vaga ativa"
              description="Você não possui vagas abertas ou em andamento."
              action={
                <Button variant="primary" size="sm" onClick={() => navigate('/empresa/nova-vaga')}>
                  Publicar Nova Vaga
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {activeJobs.map((job) => {
                const pendingApps = (job.applications || []).filter(
                  (a) => a.status === 'pendente'
                )
                const pendingCount = pendingApps.length

                return (
                  <div
                    key={job.id}
                    className="bg-white rounded-qe-md border border-qe-gray-200 p-5 flex flex-col justify-between hover:border-qe-gray-300 transition-colors shadow-qe-sm"
                  >
                    {/* Header da vaga */}
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-qe-yellow-subtle flex items-center justify-center shrink-0">
                          {getCategoryIcon(job.categoria)}
                        </div>
                        <div>
                          <h3 className="text-[16px] font-bold text-qe-gray-900 leading-snug">
                            {job.titulo}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-[12px] text-qe-gray-400 font-medium">
                            <span className="capitalize">
                              {job.categoria || 'Extra'}
                            </span>
                            <span>·</span>
                            <span className="bg-qe-gray-50 text-qe-gray-500 px-2 py-0.5 rounded-qe-xs text-[10px] font-bold uppercase tracking-[0.5px]">
                              {getJobType(job.data_inicio)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[18px] font-bold text-qe-gray-900">
                          R$ {Number(job.valor).toLocaleString('pt-BR')}
                        </div>
                        <div className="text-[11px] text-qe-gray-400">/turno</div>
                      </div>
                    </div>

                    {/* Detalhes de Data/Hora e Local */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 my-3 text-[13px] text-qe-gray-500 border-t border-b border-qe-gray-50 py-3">
                      <div className="flex items-center gap-2 font-medium">
                        <Calendar size={14} className="text-qe-gray-400" />
                        <span className="capitalize">
                          {formatJobDate(job.data_inicio)} · {formatJobTime(job.data_inicio, job.data_fim)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-medium">
                        <MapPin size={14} className="text-qe-gray-400 shrink-0" />
                        <span className="truncate">{job.local || 'Local não informado'}</span>
                      </div>
                    </div>

                    {/* Candidatos e Botão */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3">
                        {/* Avatares de candidatos pendentes (máx 3) */}
                        {pendingCount > 0 ? (
                          <div className="flex -space-x-2.5 overflow-hidden">
                            {pendingApps.slice(0, 3).map((app) => (
                              <Avatar
                                key={app.id}
                                size="xs"
                                src={app.freelancers?.profiles?.avatar_url || undefined}
                                name={app.freelancers?.profiles?.nome || 'F'}
                                className="border-2 border-white"
                              />
                            ))}
                            {pendingCount > 3 && (
                              <div className="w-7 h-7 rounded-full bg-qe-gray-100 text-qe-gray-500 flex items-center justify-center text-[10px] font-bold border-2 border-white select-none shrink-0">
                                +{pendingCount - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[12px] text-qe-gray-400 font-medium">
                            Nenhum candidato ainda
                          </span>
                        )}

                        {/* Badge de candidatos pendentes */}
                        {pendingCount > 0 && (
                          <Badge variant="urgent">
                            {pendingCount} {pendingCount === 1 ? 'CANDIDATO' : 'CANDIDATOS'}
                          </Badge>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="font-bold flex items-center gap-1 text-[13px] hover:text-qe-yellow-text"
                        onClick={() =>
                          pendingCount > 0
                            ? navigate(`/empresa/vagas/${job.id}?tab=candidatos`)
                            : navigate(`/empresa/vagas/${job.id}`)
                        }
                      >
                        {pendingCount > 0 ? 'ANALISAR PERFIS' : 'GERENCIAR'}
                        <ArrowRight size={14} />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Coluna Direita: Avaliações Pendentes + Aprovação Rápida + Precisa Hoje */}
        <div className="lg:col-span-4 space-y-6">

          {/* Avaliações pendentes */}
          {pendingReviews.length > 0 && (
            <div className="bg-white rounded-qe-md border border-qe-yellow/40 p-5 shadow-qe-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList size={16} className="text-qe-yellow-text" />
                  <h3 className="text-[15px] font-bold text-qe-gray-900">Avaliações Pendentes</h3>
                </div>
                <span className="text-[11px] font-bold bg-qe-navy/10 text-qe-navy px-2 py-0.5 rounded-full">
                  {pendingReviews.length}
                </span>
              </div>
              <div className="space-y-3">
                {pendingReviews.map((rev) => {
                  const daysLeft = Math.max(0, Math.ceil(
                    (new Date(rev.expires_at).getTime() - Date.now()) / 86_400_000
                  ))
                  return (
                    <div
                      key={rev.id}
                      className="flex items-center justify-between gap-3 p-3 bg-qe-gray-50 rounded-qe-sm border border-qe-gray-100"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar size="sm" src={rev.avaliado_avatar ?? undefined} name={rev.avaliado_nome} />
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-qe-gray-900 truncate">{rev.avaliado_nome}</div>
                          <div className="text-[11px] text-qe-gray-400 truncate">{daysLeft}d restante{daysLeft !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => openReview(rev)}>
                        Avaliar
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Atalho de aprovação */}
          <div className="bg-white rounded-qe-md border border-qe-gray-200 p-5 shadow-qe-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-[15px] font-bold text-qe-gray-900">Aprovação Rápida</h3>
                <p className="text-[11px] text-qe-gray-400 mt-0.5">Candidaturas aguardando resposta</p>
              </div>
              {pendingCandidates.length > 0 && (
                <button
                  type="button"
                  className="text-[11px] font-bold text-qe-yellow-text hover:underline cursor-pointer"
                  onClick={() => navigate('/empresa/candidatos')}
                >
                  Ver todas
                </button>
              )}
            </div>

            {pendingCandidates.length === 0 ? (
              <div className="text-center py-6 text-qe-gray-400 text-[13px]">
                Nenhum candidato aguardando resposta rápida.
              </div>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {pendingCandidates.slice(0, 4).map((cand) => (
                  <div
                    key={cand.id}
                    className="flex items-center justify-between gap-3 p-3 bg-qe-gray-50 rounded-qe-sm border border-qe-gray-100"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        size="sm"
                        src={cand.avatar || undefined}
                        name={cand.name}
                      />
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-qe-gray-900 truncate">
                          {cand.name}
                        </div>
                        <div className="text-[11px] text-qe-gray-400 truncate">
                          Para: {cand.jobTitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleReject(cand.id, cand.name)}
                        className="w-8 h-8 rounded-full bg-qe-error-bg hover:bg-qe-error/20 flex items-center justify-center text-qe-error border-none cursor-pointer"
                        title="Recusar Candidato"
                      >
                        <X size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerApprove(cand.id, cand.name, cand.celular || null)}
                        className="w-8 h-8 rounded-full bg-qe-success-bg hover:bg-qe-success/20 flex items-center justify-center text-qe-success border-none cursor-pointer"
                        title="Aprovar Candidato"
                      >
                        <Check size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card Escuro "Precisa de alguém hoje?" */}
          <div className="bg-qe-navy text-white rounded-qe-lg p-5 shadow-qe-sm space-y-4 relative overflow-hidden">
            <div className="absolute right-[-15px] top-[-15px] w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-[1px] uppercase text-white bg-white/20 px-2 py-0.5 rounded-qe-xs w-max">
                Urgência ⚡
              </span>
              <h3 className="text-[16px] font-bold pt-1.5">Precisa de alguém hoje?</h3>
              <p className="text-[12px] text-white/70 leading-relaxed">
                Publique uma vaga com destaque vermelho "Urgente" e atraia freelancers 3x mais rápido.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              className="w-full font-bold shadow-qe-sm bg-qe-yellow hover:bg-qe-yellow-hover text-qe-black"
              onClick={() => navigate('/empresa/nova-vaga?urgent=true')}
            >
              PUBLICAR URGENTE
            </Button>
          </div>

          {/* Últimas Concluídas */}
          <div className="bg-white rounded-qe-md border border-qe-gray-200 p-5 shadow-qe-sm space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-[15px] font-bold text-qe-gray-900">Últimas Concluídas</h3>
                <p className="text-[11px] text-qe-gray-400 mt-0.5">Últimos trabalhos concluídos</p>
              </div>
              <button
                type="button"
                className="text-[11px] font-bold text-qe-yellow-text hover:underline cursor-pointer shrink-0"
                onClick={() => navigate('/empresa/vagas?tab=finalizadas')}
              >
                Ver todas
              </button>
            </div>

            {latestFinished.length === 0 ? (
              <div className="text-center py-6 text-qe-gray-400 text-[13px]">
                Nenhuma vaga concluída no histórico.
              </div>
            ) : (
              <>
              <div className="space-y-3">
                {latestFinished.map((job) => {
                  // Achar avaliação que a empresa recebeu ou fez para esta vaga
                  const rating = job.reviews?.[0]?.nota
                  const approvedCandidate = job.applications?.find((a) => a.status === 'aprovado')
                  const workerName = approvedCandidate?.freelancers?.profiles?.nome || 'Freelancer'

                  return (
                    <div
                      key={job.id}
                      className="p-3 bg-qe-gray-50 rounded-qe-sm border border-qe-gray-100 space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-bold text-qe-gray-900 truncate">
                            {job.titulo}
                          </h4>
                          <p className="text-[11px] text-qe-gray-400 truncate">
                            Com: {workerName}
                          </p>
                        </div>
                        {rating && (
                          <div className="flex items-center gap-0.5 bg-qe-yellow-subtle text-qe-yellow-text px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">
                            <Star size={10} fill="currentColor" />
                            <span>{rating}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-qe-gray-400">
                        Concluída em: {new Date(job.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  )
                })}
              </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Modal de Avaliação Pendente */}
      {activeReview && (
        <ReviewModal
          open={reviewModalOpen}
          onClose={closeReview}
          reviewId={activeReview.id}
          avaliadoNome={activeReview.avaliado_nome}
          avaliadoAvatar={activeReview.avaliado_avatar}
          jobTitulo={activeReview.job_titulo}
          onDone={handleReviewDone}
        />
      )}

      {/* Modal de Confirmação de Aprovação (MVP sem Stripe) */}
      <ResponsiveSheet
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Confirmar Contratação"
      >
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-qe-md p-4">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="text-[13px] text-amber-800 leading-relaxed">
              <strong>Integração de pagamento em breve!</strong> No momento, a plataforma não
              processa pagamentos via cartão/Pix. Você deve combinar o pagamento da diária
              diretamente com o profissional após o fim do turno.
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[14px] text-qe-gray-700">
              Deseja realmente confirmar a contratação de <strong>{confirmFreelancerName}</strong>?
            </p>

            <div className="bg-qe-gray-50 border border-qe-gray-100 rounded-qe-sm p-4 space-y-2">
              <div className="text-[11px] font-bold text-qe-gray-400 uppercase tracking-[0.5px]">
                Contato Liberado do Profissional
              </div>
              <div className="flex items-center gap-2 text-[14px] text-qe-gray-800 font-bold">
                <Phone size={15} className="text-qe-yellow-text" />
                <span>{confirmFreelancerPhone || 'Não informado'}</span>
              </div>
              <p className="text-[11px] text-qe-gray-400 mt-1">
                Uma vez aprovado, o contato de celular do profissional será exibido no seu painel para contato via WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end pt-4 border-t border-qe-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isActionLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={confirmApprove}
              loading={isActionLoading}
            >
              Confirmar Aprovação
            </Button>
          </div>
        </div>
      </ResponsiveSheet>
    </div>
  )
}
