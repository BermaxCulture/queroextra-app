import * as React from 'react'

const IS_SANDBOX = import.meta.env.VITE_VALIDAPAY_ENV === 'sandbox'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Avatar,
  Button,
  useToast,
  EmptyState,
  ResponsiveSheet,
  Tabs,
  SkeletonCard,
} from '@/components/ui'
import type { TabItem } from '@/components/ui'
import {
  Phone,
  MessageCircle,
  Check,
  X,
  AlertCircle,
  Users,
  Star,
  Eye,
  Briefcase,
  Calendar,
  Clock,
  Copy,
  QrCode,
  HelpCircle,
  Ban,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { ReviewModal } from '@/components/ReviewModal/ReviewModal'
import { fetchPendingReviews } from '@/hooks/useReviews'
import type { PendingReview } from '@/hooks/useReviews'

// Taxa fixa da plataforma somada em cima do valor da vaga — precisa bater com
// o valor usado em supabase/functions/create-pix-charge/index.ts.
const TAXA_PLATAFORMA = 10.0

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface FreelancerProfile {
  id: string
  nome: string
  avatar_url: string | null
  email: string | null
}

interface Application {
  id: string
  job_id: string
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'concluido'
  created_at: string
  jobs: {
    id: string
    titulo: string
    valor: number
    categoria: string | null
    data_inicio: string | null
  } | null
  freelancers: {
    id: string
    habilidades: string[] | null
    profiles: FreelancerProfile
  } | null
}

interface Experience {
  id: string
  created_at: string
  jobs: {
    titulo: string
    categoria: string | null
    valor: number
    data_inicio: string | null
    data_fim: string | null
  } | null
}

type CandidateTab = 'pendente' | 'aprovado' | 'rejeitado' | 'concluido'

const CANDIDATE_TABS: TabItem[] = [
  { label: 'Pendentes',  value: 'pendente'  },
  { label: 'Aprovados',  value: 'aprovado'  },
  { label: 'Recusados',  value: 'rejeitado' },
  { label: 'Histórico',  value: 'concluido' },
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CandidatosTabProps {
  /** Filtra candidatos desta vaga. Omitir para mostrar todos da empresa. */
  jobId?: string
  /** Oculta o bloco de informações da vaga no card. */
  hideJobInfo?: boolean
  /**
   * Nome do query param usado para controlar a subtab ativa.
   * Padrão: 'status' → /empresa/candidatos?status=aprovado
   * Em VagaDetalhe usar 'candidatoStatus' para não conflitar com ?tab=candidatos
   */
  tabParamName?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StarRating({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[12px] text-qe-gray-400">Sem avaliações</span>
  return (
    <span className="flex items-center gap-1 text-[12px] font-bold text-qe-gray-700">
      <Star size={12} className="fill-[--qe-yellow] text-[--qe-yellow]" />
      {value.toFixed(1)}
    </span>
  )
}

function formatMonthYear(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// Formata número de telefone para exibição: 91999207681 → (91) 9 9920-7681
// ---------------------------------------------------------------------------

function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0,2)}) ${d[2]} ${d.slice(3,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return phone
}

// ---------------------------------------------------------------------------
// Tooltip — por que o contato é liberado só após o PIX
// ---------------------------------------------------------------------------

function PixContactTooltip() {
  const [visible, setVisible] = React.useState(false)

  return (
    <div className="relative inline-flex ml-auto shrink-0">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        onClick={() => setVisible((v) => !v)}
        className="text-qe-gray-400 hover:text-qe-gray-600 transition-colors"
        aria-label="Por que o contato é liberado após o pagamento?"
      >
        <HelpCircle size={14} />
      </button>

      {visible && (
        <div className="absolute bottom-full right-0 mb-2 z-50 w-[230px]">
          <div className="bg-qe-gray-900 text-white text-[12px] leading-relaxed rounded-qe-md px-3 py-2.5 shadow-qe-lg">
            <p className="font-semibold mb-1">Por que após o pagamento?</p>
            <p>
              O contato só é liberado depois que o pagamento é confirmado para proteger ambos os lados:
              o profissional garante que será pago, e a empresa garante o comprometimento do profissional com o turno.
            </p>
          </div>
          <div className="flex justify-end pr-1.5">
            <div className="w-2 h-2 bg-qe-gray-900 rotate-45 -mt-1" />
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function CandidatosTab({
  jobId,
  hideJobInfo,
  tabParamName = 'status',
}: CandidatosTabProps) {
  const { company, profile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Tab ativa e highlight via URL
  const activeTab = (searchParams.get(tabParamName) as CandidateTab) || 'pendente'
  const highlightedId = searchParams.get('highlight')

  const setActiveTab = React.useCallback(
    (tab: CandidateTab) => {
      setSearchParams(
        (prev) => { prev.set(tabParamName, tab); prev.delete('highlight'); return prev },
        { replace: true }
      )
    },
    [setSearchParams, tabParamName]
  )

  // Remove highlight após 3s
  React.useEffect(() => {
    if (!highlightedId) return
    const t = setTimeout(() => {
      setSearchParams((prev) => { prev.delete('highlight'); return prev }, { replace: true })
    }, 3000)
    return () => clearTimeout(t)
  }, [highlightedId, setSearchParams])

  // Dados
  const [applications, setApplications] = React.useState<Application[]>([])
  const [ratings, setRatings] = React.useState<Record<string, number>>({})
  const [celulares, setCelulares] = React.useState<Record<string, string | null>>({})
  const [loading, setLoading] = React.useState(true)
  const [isActionLoading, setIsActionLoading] = React.useState(false)

  // Avaliações pendentes (aba Histórico): jobId → PendingReview
  const [pendingReviewsMap, setPendingReviewsMap] = React.useState<Record<string, PendingReview>>({})
  // jobIds onde a empresa já enviou avaliação
  const [reviewedJobIds,   setReviewedJobIds]   = React.useState<Set<string>>(new Set())
  const [activeReview,     setActiveReview]     = React.useState<PendingReview | null>(null)
  const [reviewModalOpen,  setReviewModalOpen]  = React.useState(false)

  const openReview = (rev: PendingReview) => { setActiveReview(rev); setReviewModalOpen(true) }

  const refreshHistoricoReviews = React.useCallback(async () => {
    if (!company?.profile_id) return
    // Busca reviews enviadas por esta empresa
    const { data: sent } = await supabase
      .from('reviews')
      .select('job_id')
      .eq('avaliador_id', company.profile_id)
      .eq('status', 'enviada')
    setReviewedJobIds(new Set((sent ?? []).map((r: { job_id: string }) => r.job_id)))

    // Busca reviews pendentes
    const revs = await fetchPendingReviews(company.profile_id)
    const map: Record<string, PendingReview> = {}
    for (const r of revs) map[r.job_id] = r
    setPendingReviewsMap(map)
  }, [company?.profile_id])

  const handleReviewDone = async () => {
    setReviewModalOpen(false)
    await refreshHistoricoReviews()
  }

  // Modais
  const [isApproveOpen, setIsApproveOpen] = React.useState(false)
  const [approveTarget, setApproveTarget] = React.useState<{
    appId: string; nome: string; profileId: string; valorVaga: number
  } | null>(null)

  const [isRejectOpen, setIsRejectOpen] = React.useState(false)
  const [rejectTarget, setRejectTarget] = React.useState<{
    appId: string; nome: string
  } | null>(null)

  const [isBlockOpen, setIsBlockOpen] = React.useState(false)
  const [blockTarget, setBlockTarget] = React.useState<{
    freelancerId: string; nome: string
  } | null>(null)
  const [blockReason, setBlockReason] = React.useState('')

  // PIX State
  const [pixData, setPixData] = React.useState<{ chargeId: string; emv: string } | null>(null)
  const [pixStatus, setPixStatus] = React.useState<'PENDING' | 'PAID' | 'EXPIRED'>('PENDING')
  const [pollingTimeout, setPollingTimeout] = React.useState<ReturnType<typeof setTimeout> | null>(null)
  const [realtimeChannel, setRealtimeChannel] = React.useState<ReturnType<typeof supabase.channel> | null>(null)
  const [simulatingPayment, setSimulatingPayment] = React.useState(false)
  const [revealedPhone, setRevealedPhone] = React.useState<string | null>(null)

  // Limpa polling/realtime ao desmontar ou fechar
  React.useEffect(() => {
    if (!isApproveOpen) {
      if (pollingTimeout) {
        clearTimeout(pollingTimeout)
        setPollingTimeout(null)
      }
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
        setRealtimeChannel(null)
      }
      setPixData(null)
      setPixStatus('PENDING')
    }
  }, [isApproveOpen, pollingTimeout, realtimeChannel])

  // Sheet Perfil
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [profileTarget, setProfileTarget] = React.useState<Application | null>(null)
  const [experiences, setExperiences] = React.useState<Experience[]>([])
  const [loadingExp, setLoadingExp] = React.useState(false)

  // -------------------------------------------------------------------------
  // Busca candidaturas
  // -------------------------------------------------------------------------

  const fetchApplications = React.useCallback(async () => {
    if (!company?.id) return
    try {
      setLoading(true)

      let query = supabase
        .from('applications')
        .select(`
          id,
          job_id,
          status,
          created_at,
          jobs!inner(
            id,
            titulo,
            valor,
            categoria,
            data_inicio,
            company_id
          ),
          freelancers(
            id,
            habilidades,
            profiles(
              id,
              nome,
              avatar_url,
              email
            )
          )
        `)
        .eq('status', activeTab)
        .order('created_at', { ascending: false })

      // celular NÃO está na query — é buscado via RPC segura apenas quando aprovado

      if (jobId) {
        query = query.eq('job_id', jobId)
      } else {
        query = query.eq('jobs.company_id', company.id)
      }

      const { data, error } = await query
      if (error) throw error

      const apps = (data as unknown as Application[]) || []
      setApplications(apps)

      const profileIds = apps
        .map((a) => a.freelancers?.profiles?.id)
        .filter((id): id is string => Boolean(id))

      // Ratings (apenas reviews enviadas)
      if (profileIds.length > 0) {
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('avaliado_id, nota')
          .in('avaliado_id', profileIds)
          .eq('status', 'enviada')

        if (reviewsData?.length) {
          const sums: Record<string, { total: number; count: number }> = {}
          for (const r of reviewsData) {
            if (!sums[r.avaliado_id]) sums[r.avaliado_id] = { total: 0, count: 0 }
            sums[r.avaliado_id].total += r.nota
            sums[r.avaliado_id].count += 1
          }
          const avgs: Record<string, number> = {}
          for (const [id, { total, count }] of Object.entries(sums)) avgs[id] = total / count
          setRatings(avgs)
        } else {
          setRatings({})
        }

        // Avaliações pendentes e enviadas: apenas na aba Histórico
        if (activeTab === 'concluido') {
          await refreshHistoricoReviews()
        } else {
          setPendingReviewsMap({})
          setReviewedJobIds(new Set())
        }

        // Celulares: apenas na aba aprovados, via função SECURITY DEFINER
        if (activeTab === 'aprovado') {
          const { data: celularData } = await supabase.rpc('get_celulares_if_approved', {
            p_profile_ids: profileIds,
            p_company_id: company.id,
          })
          const map: Record<string, string | null> = {}
          for (const row of (celularData as { profile_id: string; celular: string | null }[] | null) ?? []) {
            map[row.profile_id] = row.celular
          }
          setCelulares(map)
        } else {
          setCelulares({})
        }
      } else {
        setRatings({})
        setCelulares({})
      }
    } catch (err: unknown) {
      console.error('[CandidatosTab] Erro ao buscar candidaturas:', err)
      showToast('Não foi possível carregar as candidaturas.', 'error')
    } finally {
      setLoading(false)
    }
  }, [company?.id, activeTab, jobId, showToast, refreshHistoricoReviews])

  React.useEffect(() => { fetchApplications() }, [fetchApplications])

  // Realtime
  React.useEffect(() => {
    if (!company?.id) return
    const channel = supabase
      .channel(`candidatos-tab-${jobId ?? 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
        fetchApplications()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [company?.id, jobId, fetchApplications])

  // -------------------------------------------------------------------------
  // Experiências (lazy, ao abrir perfil)
  // -------------------------------------------------------------------------

  const fetchExperiences = React.useCallback(async (freelancerId: string) => {
    try {
      setLoadingExp(true)
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          created_at,
          jobs!inner(titulo, categoria, valor, data_inicio, data_fim)
        `)
        .eq('freelancer_id', freelancerId)
        .eq('status', 'concluido')
        .eq('jobs.status', 'finalizada')
        .order('created_at', { ascending: false })

      if (error) throw error
      setExperiences((data as unknown as Experience[]) || [])
    } catch {
      setExperiences([])
    } finally {
      setLoadingExp(false)
    }
  }, [])

  // -------------------------------------------------------------------------
  // Ações
  // -------------------------------------------------------------------------

  const notify = async (appId: string, action: 'aprovado' | 'rejeitado') => {
    try {
      await supabase.functions.invoke('notify-application', {
        body: { application_id: appId, action },
      })
    } catch (err) {
      console.error('[CandidatosTab] Falha ao disparar notificação:', err)
    }
  }

  const handleApprove = async () => {
    if (!approveTarget) return
    try {
      setIsActionLoading(true)

      // Sempre gera a cobrança PIX real — a confirmação de pagamento (e a
      // liberação do telefone) só acontece depois que o pagamento é
      // verificado de verdade via startPixWatching (Realtime + poll de segurança).
      // 1. Gera a cobrança com split
      const { data: chargeData, error: chargeErr } = await supabase.functions.invoke(
        'create-pix-charge',
        { body: { application_id: approveTarget.appId } }
      )

      if (chargeErr || !chargeData?.emv) {
        throw new Error(chargeErr?.message || chargeData?.error || 'Erro ao gerar PIX')
      }

      setPixData({ chargeId: chargeData.chargeId, emv: chargeData.emv })
      setPixStatus('PENDING')
      startPixWatching(chargeData.chargeId, approveTarget.appId)

    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Erro ao aprovar candidato e gerar PIX.', 'error')
    } finally {
      setIsActionLoading(false)
    }
  }

  // Evita tratar o pagamento duas vezes se o Realtime e o poll de segurança
  // detectarem o PAID quase ao mesmo tempo (closures antigos podem não ver o
  // pixStatus mais recente, por isso um ref em vez de state aqui).
  const paidHandledRef = React.useRef(false)

  const handlePixPaid = async (appId: string) => {
    if (paidHandledRef.current) return
    paidHandledRef.current = true

    showToast('Pagamento confirmado! Candidato aprovado.', 'success')
    const profileId = approveTarget?.profileId ?? ''
    // Pagamento real: a notificação (e-mail + in-app) já foi disparada pelo
    // backend (webhook ou get-charge-status, quem vencer a corrida) — não
    // repete aqui pra não duplicar.
    await handlePaymentConfirmed(appId, profileId, { skipNotify: true })
  }

  // Detecção principal: Realtime na linha da transação — o webhook da
  // ValidaPay grava status 'retido' no banco assim que o pagamento é
  // confirmado, e o Postgres Changes empurra isso pro frontend na hora, sem
  // ficar batendo na API da ValidaPay a cada poll.
  // Poll de segurança (bem mais espaçado, 30s): cobre o caso de o Realtime
  // cair/desconectar, e também é quem detecta cobrança EXPIRADA — esse
  // estado só existe na ValidaPay, nunca é escrito na nossa tabela.
  const startPixWatching = (chargeId: string, appId: string) => {
    paidHandledRef.current = false

    const channel = supabase
      .channel(`pix-charge-${chargeId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transactions', filter: `gateway_charge_id=eq.${chargeId}` },
        (payload) => {
          if ((payload.new as { status?: string })?.status === 'retido') {
            handlePixPaid(appId)
          }
        }
      )
      .subscribe()
    setRealtimeChannel(channel)

    const poll = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-charge-status', {
          body: { chargeId }
        })

        if (data?.status === 'PAID') {
          await handlePixPaid(appId)
          return
        }

        if (data?.status === 'EXPIRED') {
          setPixStatus('EXPIRED')
          showToast('A cobrança PIX expirou.', 'error')
          return
        }
      } catch (err) {
        console.error('Erro no poll de segurança:', err)
      }

      if (!paidHandledRef.current) {
        setPollingTimeout(setTimeout(poll, 30000))
      }
    }

    setPollingTimeout(setTimeout(poll, 30000))
  }

  const copyPix = () => {
    if (pixData?.emv) {
      navigator.clipboard.writeText(pixData.emv)
      showToast('Código PIX copiado!', 'success')
    }
  }

  const handlePaymentConfirmed = async (appId: string, profileId: string, options?: { skipNotify?: boolean }) => {
    setPixStatus('PAID')
    if (!options?.skipNotify) {
      await notify(appId, 'aprovado')
    }

    // Busca o celular do freelancer via RPC segura (mesmo mecanismo da aba aprovados)
    try {
      const { data: celularData } = await supabase.rpc('get_celulares_if_approved', {
        p_profile_ids: [profileId],
        p_company_id: company?.id,
      })
      const row = (celularData as { profile_id: string; celular: string | null }[] | null)?.[0]
      setRevealedPhone(row?.celular ?? null)
    } catch {
      setRevealedPhone(null)
    }
  }

  const handleSimulatePayment = async () => {
    if (!pixData?.chargeId || !approveTarget) return
    setSimulatingPayment(true)
    try {
      const { data, error } = await supabase.functions.invoke('simulate-payment', {
        body: { chargeId: pixData.chargeId },
      })
      if (error) throw error
      if (!data?.ok) throw new Error(data?.error ?? 'Erro ao simular pagamento')

      // Trava o ref pra o Realtime não reprocessar essa mesma escrita
      // (simulate-payment também grava status 'retido' na transação).
      paidHandledRef.current = true
      await handlePaymentConfirmed(approveTarget.appId, approveTarget.profileId)
      showToast('Pagamento simulado com sucesso! ✅', 'success')
    } catch (err: any) {
      showToast(`Erro: ${err?.message ?? 'Tente novamente'}`, 'error')
    } finally {
      setSimulatingPayment(false)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    try {
      setIsActionLoading(true)
      const { error } = await supabase
        .from('applications')
        .update({ status: 'rejeitado' })
        .eq('id', rejectTarget.appId)
      if (error) throw error
      await notify(rejectTarget.appId, 'rejeitado')
      showToast(`${rejectTarget.nome} recusado.`, 'info')
      setIsRejectOpen(false)
      fetchApplications()
    } catch {
      showToast('Erro ao recusar candidato.', 'error')
    } finally {
      setIsActionLoading(false)
    }
  }

  const triggerApprove = (app: Application) => {
    const f = app.freelancers?.profiles
    if (!f) return
    setApproveTarget({ appId: app.id, nome: f.nome, profileId: f.id, valorVaga: Number(app.jobs?.valor ?? 0) })
    setIsApproveOpen(true)
  }

  const triggerReject = (app: Application) => {
    const f = app.freelancers?.profiles
    if (!f) return
    setRejectTarget({ appId: app.id, nome: f.nome })
    setIsRejectOpen(true)
  }

  const triggerProfile = (app: Application) => {
    setProfileTarget(app)
    setIsProfileOpen(true)
    if (app.freelancers?.id) fetchExperiences(app.freelancers.id)
  }

  const triggerBlock = (app: Application) => {
    const f = app.freelancers?.profiles
    if (!f || !app.freelancers?.id) return
    setBlockTarget({ freelancerId: app.freelancers.id, nome: f.nome })
    setBlockReason('')
    setIsBlockOpen(true)
  }

  const handleBlockFreelancer = async () => {
    if (!blockTarget || !company?.id) return
    setIsActionLoading(true)
    const { error } = await supabase.from('company_freelancer_blocks').insert({
      company_id: company.id,
      freelancer_id: blockTarget.freelancerId,
      reason: blockReason.trim() || null,
      created_by: profile?.id,
    })

    if (error) {
      showToast(
        error.code === '23505' ? 'Este prestador já está bloqueado.' : 'Erro ao bloquear prestador.',
        'error'
      )
    } else {
      showToast(`${blockTarget.nome} não verá mais suas vagas.`, 'success')
      setIsBlockOpen(false)
      setBlockTarget(null)
    }
    setIsActionLoading(false)
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <Tabs
        tabs={CANDIDATE_TABS}
        activeTab={activeTab}
        onChange={(v) => setActiveTab(v as CandidateTab)}
      />

      {loading ? (
        <div className="space-y-4 mt-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : applications.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<Users size={48} className="text-qe-gray-300" />}
            title="Nenhum candidato"
            description={`Nenhum profissional com status "${activeTab}" encontrado.`}
          />
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          <AnimatePresence initial={false}>
            {applications.map((app) => {
              const freelancer = app.freelancers?.profiles
              if (!freelancer) return null
              const avgRating = ratings[freelancer.id] ?? null
              const habilidades = app.freelancers?.habilidades ?? []
              const isHighlighted = highlightedId === app.id
              const celular = celulares[freelancer.id] ?? null

              return (
                <motion.div
                  key={app.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    boxShadow: isHighlighted
                      ? [
                          '0 0 0 2px rgba(26,158,92,0.6)',
                          '0 0 0 4px rgba(26,158,92,0.2)',
                          '0 0 0 2px rgba(26,158,92,0.6)',
                        ]
                      : '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                  transition={
                    isHighlighted
                      ? { boxShadow: { repeat: 3, duration: 0.7, ease: 'easeInOut' } }
                      : { duration: 0.18, ease: 'easeOut' }
                  }
                  className={[
                    'bg-white rounded-qe-md border p-5 flex flex-col gap-4 transition-colors',
                    isHighlighted
                      ? 'border-qe-success'
                      : 'border-qe-gray-200 hover:border-qe-gray-300',
                  ].join(' ')}
                >
                  {/* Identidade + ações */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <Avatar
                        src={freelancer.avatar_url || undefined}
                        name={freelancer.nome}
                        size="md"
                        verified
                      />
                      <div className="min-w-0">
                        <h3 className="text-[16px] font-bold text-qe-gray-900 truncate">
                          {freelancer.nome}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarRating value={avgRating} />
                          <span className="text-qe-gray-300">·</span>
                          <span className="text-[12px] text-qe-gray-400">
                            {new Date(app.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {habilidades.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {habilidades.slice(0, 3).map((h) => (
                              <span
                                key={h}
                                className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-qe-yellow-subtle text-qe-yellow-text border border-qe-yellow/30"
                              >
                                {h}
                              </span>
                            ))}
                            {habilidades.length > 3 && (
                              <span className="text-[11px] text-qe-gray-400 self-center">
                                +{habilidades.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        leadingIcon={<Eye size={14} />}
                        onClick={() => triggerProfile(app)}
                        className="text-[12px] hidden sm:flex"
                      >
                        Ver Perfil
                      </Button>
                      <button
                        type="button"
                        onClick={() => triggerProfile(app)}
                        className="sm:hidden p-2 rounded-full text-qe-gray-500 hover:bg-qe-gray-100"
                        aria-label="Ver perfil"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerBlock(app)}
                        aria-label="Bloquear prestador"
                        title="Bloquear prestador para suas vagas"
                        className="p-2 rounded-full text-qe-gray-400 hover:bg-qe-error-bg hover:text-qe-error transition-colors"
                      >
                        <Ban size={16} />
                      </button>

                      {activeTab === 'pendente' && (
                        <>
                          <button
                            type="button"
                            onClick={() => triggerReject(app)}
                            aria-label="Recusar candidato"
                            className="flex items-center justify-center w-9 h-9 rounded-full bg-qe-error-bg text-qe-error hover:bg-qe-error/20 transition-colors"
                          >
                            <X size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerApprove(app)}
                            aria-label="Aprovar candidato"
                            className="flex items-center justify-center w-9 h-9 rounded-full bg-qe-success-bg text-qe-success hover:bg-qe-success/20 transition-colors"
                          >
                            <Check size={16} />
                          </button>
                        </>
                      )}

                      {activeTab === 'aprovado' && (
                        <span className="flex items-center gap-1 text-qe-success font-bold text-[13px]">
                          <Check size={14} /> Aprovado
                        </span>
                      )}

                      {activeTab === 'rejeitado' && (
                        <span className="flex items-center gap-1 text-qe-error font-bold text-[13px] bg-qe-error-bg px-3 py-1.5 rounded-qe-xs border border-qe-error/20">
                          <X size={13} /> Recusado
                        </span>
                      )}

                      {activeTab === 'concluido' && (() => {
                        const pending = pendingReviewsMap[app.job_id]
                        const alreadyRated = reviewedJobIds.has(app.job_id)
                        if (pending) {
                          return (
                            <Button
                              variant="primary"
                              size="sm"
                              leadingIcon={<Star size={13} />}
                              onClick={() => openReview(pending)}
                            >
                              Avaliar
                            </Button>
                          )
                        }
                        if (alreadyRated) {
                          return (
                            <span className="flex items-center gap-1 text-qe-success font-bold text-[13px]">
                              <Check size={14} /> Avaliado
                            </span>
                          )
                        }
                        return (
                          <span className="text-[12px] text-qe-gray-400 font-medium">Prazo expirado</span>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Rodapé: info da vaga + contatos */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-qe-gray-100">
                    {!hideJobInfo && (
                      <div className="flex flex-wrap items-center gap-2 text-[12px] text-qe-gray-500">
                        <span className="font-bold text-qe-gray-900 truncate max-w-[200px]">
                          {app.jobs?.titulo}
                        </span>
                        <span className="text-qe-gray-300">·</span>
                        <span className="capitalize">{app.jobs?.categoria || 'Extra'}</span>
                        <span className="text-qe-gray-300">·</span>
                        <span className="text-qe-success font-bold">
                          R$ {Number(app.jobs?.valor || 0).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}

                    {activeTab === 'aprovado' && (
                      <div className="flex gap-2 ml-auto flex-wrap">
                        {celular && (
                          <>
                            <a
                              href={`tel:${celular}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-qe-gray-50 border border-qe-gray-200 text-qe-gray-700 text-[12px] font-bold rounded-qe-sm hover:border-qe-gray-300 transition-all"
                            >
                              <Phone size={12} /> Ligar
                            </a>
                            <a
                              href={`https://wa.me/55${celular.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-[12px] font-bold rounded-qe-sm hover:bg-[#20ba59] transition-all"
                            >
                              <MessageCircle size={12} /> WhatsApp
                            </a>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/empresa/vagas/${app.job_id}/checkin/${app.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-qe-yellow text-qe-black text-[12px] font-bold rounded-qe-sm hover:bg-qe-yellow/80 transition-all"
                        >
                          <Clock size={12} /> Check-In
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Modal: Avaliar freelancer do Histórico                             */}
      {/* ------------------------------------------------------------------ */}
      {activeReview && (
        <ReviewModal
          open={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          reviewId={activeReview.id}
          avaliadoNome={activeReview.avaliado_nome}
          avaliadoAvatar={activeReview.avaliado_avatar}
          jobTitulo={activeReview.job_titulo}
          onDone={handleReviewDone}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Modal: Confirmar Aprovação                                          */}
      {/* ------------------------------------------------------------------ */}
      <ResponsiveSheet
        open={isApproveOpen}
        onClose={() => !isActionLoading && setIsApproveOpen(false)}
        title={pixStatus === 'PAID' ? 'Contratação Confirmada' : 'Confirmar Contratação'}
      >
        <div className="p-6">
          {pixStatus === 'PAID' ? (
            /* ── Tela de sucesso — substitui todo o conteúdo ── */
            <div className="flex flex-col items-center gap-5 text-center py-2 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <Check size={32} className="text-green-500" />
              </div>
              <div>
                <h3 className="font-bold text-[20px] text-qe-gray-900">Pagamento Confirmado!</h3>
                <p className="text-[14px] text-qe-gray-500 mt-1">
                  {approveTarget?.nome} foi aprovado(a).
                </p>
              </div>

              {revealedPhone ? (
                <div className="w-full space-y-3">
                  <div className="bg-qe-gray-50 border border-qe-gray-200 rounded-qe-md p-4 text-left">
                    <p className="text-[11px] text-qe-gray-400 uppercase tracking-wide mb-1">Contato liberado</p>
                    <p className="text-[22px] font-bold text-qe-gray-900 tracking-wide">
                      {formatPhoneDisplay(revealedPhone)}
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/55${revealedPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-[48px] bg-[#25D366] text-white font-semibold text-[15px] rounded-qe-pill hover:bg-[#1ebe5d] transition-colors"
                  >
                    Chamar no WhatsApp
                  </a>
                </div>
              ) : (
                <div className="w-full bg-qe-gray-50 border border-qe-gray-100 rounded-qe-md p-4">
                  <p className="text-[13px] text-qe-gray-400">Número não disponível</p>
                </div>
              )}

              <button
                onClick={() => {
                  setIsApproveOpen(false)
                  setSearchParams(
                    (prev) => {
                      prev.set(tabParamName, 'aprovado')
                      prev.set('highlight', approveTarget?.appId ?? '')
                      return prev
                    },
                    { replace: true }
                  )
                  fetchApplications()
                }}
                className="text-[13px] text-qe-gray-400 hover:text-qe-gray-600 transition-colors"
              >
                Ver candidatos aprovados →
              </button>
            </div>
          ) : (
            /* ── Fluxo normal ── */
            <div className="space-y-5">
              {IS_SANDBOX && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-qe-md p-4">
                  <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                  <p className="text-[13px] text-amber-800 leading-relaxed">
                    <strong>Ambiente sandbox.</strong> O QR Code PIX gerado é fake — use o botão "Simular pagamento" para testar o fluxo completo.
                  </p>
                </div>
              )}
              <p className="text-[14px] text-qe-gray-700">
                Deseja confirmar a contratação de{' '}
                <strong className="text-qe-gray-900">{approveTarget?.nome}</strong>?
              </p>
              {!pixData && approveTarget && (
                <div className="p-3 bg-qe-yellow-bg border border-qe-yellow/30 rounded-qe-sm text-[13px] text-qe-gray-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Valor do turno</span>
                    <span>{formatCurrency(approveTarget.valorVaga)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa fixa QueroExtra</span>
                    <span>{formatCurrency(TAXA_PLATAFORMA)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-qe-gray-900 pt-1 border-t border-qe-yellow/30">
                    <span>Total do PIX</span>
                    <span>{formatCurrency(approveTarget.valorVaga + TAXA_PLATAFORMA)}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 p-3 bg-qe-gray-50 border border-qe-gray-100 rounded-qe-sm text-[13px] text-qe-gray-500">
                <Phone size={13} className="text-qe-yellow-text shrink-0" />
                <span>O número de contato será liberado após o pagamento do PIX</span>
                <PixContactTooltip />
              </div>

              {!pixData ? (
                <div className="flex items-center gap-3 justify-end pt-3 border-t border-qe-gray-100">
                  <Button variant="ghost" size="sm" onClick={() => setIsApproveOpen(false)} disabled={isActionLoading}>
                    Cancelar
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleApprove} loading={isActionLoading}>
                    Gerar Cobrança PIX
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-2 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-2 text-qe-gray-700">
                    <QrCode size={18} className="text-qe-yellow" />
                    <span className="font-bold">Escaneie para pagar</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-qe-gray-200">
                    <QRCodeSVG value={pixData.emv} size={200} />
                  </div>
                  <p className="text-[13px] text-qe-gray-500 text-center max-w-[280px]">
                    Após o pagamento, esta tela atualizará automaticamente em instantes.
                  </p>
                  <Button variant="secondary" size="sm" className="w-full" leadingIcon={<Copy size={16} />} onClick={copyPix}>
                    Copiar código Pix (Copia e Cola)
                  </Button>
                  {IS_SANDBOX && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full border-2 border-dashed border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={handleSimulatePayment}
                      loading={simulatingPayment}
                    >
                      🧪 Simular pagamento (sandbox)
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </ResponsiveSheet>

      {/* ------------------------------------------------------------------ */}
      {/* Modal: Confirmar Rejeição                                           */}
      {/* ------------------------------------------------------------------ */}
      <ResponsiveSheet
        open={isRejectOpen}
        onClose={() => !isActionLoading && setIsRejectOpen(false)}
        title="Recusar Candidato"
      >
        <div className="p-6 space-y-5">
          <p className="text-[14px] text-qe-gray-700">
            Tem certeza que deseja recusar{' '}
            <strong className="text-qe-gray-900">{rejectTarget?.nome}</strong>? O profissional
            será notificado e não poderá se recandidatar a esta vaga.
          </p>
          <div className="flex items-center gap-3 justify-end pt-3 border-t border-qe-gray-100">
            <Button variant="ghost" size="sm" onClick={() => setIsRejectOpen(false)} disabled={isActionLoading}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" onClick={handleReject} loading={isActionLoading}>
              Recusar Candidato
            </Button>
          </div>
        </div>
      </ResponsiveSheet>

      {/* ------------------------------------------------------------------ */}
      {/* Modal: Bloquear Prestador                                           */}
      {/* ------------------------------------------------------------------ */}
      <ResponsiveSheet
        open={isBlockOpen}
        onClose={() => !isActionLoading && setIsBlockOpen(false)}
        title="Bloquear Prestador"
      >
        <div className="p-6 space-y-5">
          <p className="text-[14px] text-qe-gray-700">
            <strong className="text-qe-gray-900">{blockTarget?.nome}</strong> não vai mais ver nem
            conseguir se candidatar às vagas da sua empresa. O prestador não é avisado do
            bloqueio e mantém acesso normal ao restante da plataforma.
          </p>
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-qe-gray-700">
              Motivo (opcional, uso interno)
            </label>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              rows={3}
              className="w-full border border-qe-gray-200 rounded-qe-sm px-3 py-2 text-[14px] text-qe-gray-900 resize-none focus:outline-none focus:border-qe-yellow"
              placeholder="Ex: não compareceu ao turno combinado..."
            />
          </div>
          <div className="flex items-center gap-3 justify-end pt-3 border-t border-qe-gray-100">
            <Button variant="ghost" size="sm" onClick={() => setIsBlockOpen(false)} disabled={isActionLoading}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" onClick={handleBlockFreelancer} loading={isActionLoading}>
              Bloquear Prestador
            </Button>
          </div>
        </div>
      </ResponsiveSheet>

      {/* ------------------------------------------------------------------ */}
      {/* Sheet: Ver Perfil                                                   */}
      {/* ------------------------------------------------------------------ */}
      <ResponsiveSheet
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        title="Perfil do Profissional"
      >
        {profileTarget && (() => {
          const freelancer = profileTarget.freelancers?.profiles
          if (!freelancer) return null
          const avgRating = ratings[freelancer.id] ?? null
          const habilidades = profileTarget.freelancers?.habilidades ?? []
          const isApproved = profileTarget.status === 'aprovado'
          const celular = celulares[freelancer.id] ?? null

          return (
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Identidade */}
              <div className="flex flex-col items-center text-center gap-3">
                <Avatar
                  src={freelancer.avatar_url || undefined}
                  name={freelancer.nome}
                  size="xl"
                  verified
                />
                <div>
                  <h2 className="text-[18px] font-bold text-qe-gray-900">{freelancer.nome}</h2>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    {avgRating !== null ? (
                      <>
                        <Star size={14} className="fill-[--qe-yellow] text-[--qe-yellow]" />
                        <span className="text-[14px] font-bold text-qe-gray-700">
                          {avgRating.toFixed(1)}
                        </span>
                      </>
                    ) : (
                      <span className="text-[13px] text-qe-gray-400">Sem avaliações ainda</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Especialidades */}
              {habilidades.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-qe-gray-400 uppercase tracking-[0.5px]">
                    Especialidades
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {habilidades.map((h) => (
                      <span
                        key={h}
                        className="text-[12px] font-bold px-3 py-1 rounded-full bg-qe-yellow-subtle text-qe-yellow-text border border-qe-yellow/30"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experiências */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-qe-gray-400 uppercase tracking-[0.5px]">
                  Experiências pelo Quero Extra
                </p>
                {loadingExp ? (
                  <div className="space-y-2">
                    <div className="h-14 shimmer rounded-qe-sm" />
                    <div className="h-14 shimmer rounded-qe-sm" />
                  </div>
                ) : experiences.length === 0 ? (
                  <div className="flex items-center gap-2.5 p-4 bg-qe-gray-50 border border-qe-gray-100 rounded-qe-sm">
                    <Briefcase size={16} className="text-qe-gray-300 shrink-0" />
                    <p className="text-[13px] text-qe-gray-400">Nenhum turno concluído ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {experiences.map((exp) => (
                      <div
                        key={exp.id}
                        className="flex items-start gap-3 p-3.5 bg-qe-gray-50 border border-qe-gray-100 rounded-qe-sm"
                      >
                        <div className="w-8 h-8 rounded-full bg-qe-yellow-subtle flex items-center justify-center shrink-0">
                          <Briefcase size={14} className="text-qe-yellow-text" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-qe-gray-900 truncate">
                            {exp.jobs?.titulo}
                          </p>
                          <p className="text-[12px] text-qe-gray-500 capitalize">
                            {exp.jobs?.categoria || 'Extra'}
                            {exp.jobs?.valor
                              ? ` · R$ ${Number(exp.jobs.valor).toLocaleString('pt-BR')}`
                              : ''}
                          </p>
                          {(exp.jobs?.data_inicio || exp.jobs?.data_fim) && (
                            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-qe-gray-400">
                              <Calendar size={10} />
                              {[
                                formatMonthYear(exp.jobs?.data_inicio),
                                formatMonthYear(exp.jobs?.data_fim),
                              ]
                                .filter(Boolean)
                                .join(' → ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contato — apenas se aprovado e celular disponível */}
              {isApproved && celular && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-qe-gray-400 uppercase tracking-[0.5px]">
                    Contato
                  </p>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${celular}`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-qe-gray-50 border border-qe-gray-200 text-qe-gray-700 text-[13px] font-bold rounded-qe-sm hover:border-qe-gray-300 transition-all"
                    >
                      <Phone size={14} /> {celular}
                    </a>
                    <a
                      href={`https://wa.me/55${celular.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#25D366] text-white text-[13px] font-bold rounded-qe-sm hover:bg-[#20ba59] transition-all"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {/* Ações — apenas se pendente */}
              {profileTarget.status === 'pendente' && (
                <div className="flex gap-3 pt-3 border-t border-qe-gray-100">
                  <Button
                    variant="secondary"
                    size="md"
                    className="flex-1"
                    onClick={() => {
                      setIsProfileOpen(false)
                      setTimeout(() => triggerReject(profileTarget), 150)
                    }}
                  >
                    Recusar
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    className="flex-1"
                    onClick={() => {
                      setIsProfileOpen(false)
                      setTimeout(() => triggerApprove(profileTarget), 150)
                    }}
                  >
                    Aprovar
                  </Button>
                </div>
              )}
            </div>
          )
        })()}
      </ResponsiveSheet>
    </>
  )
}
