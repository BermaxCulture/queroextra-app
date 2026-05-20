import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  TopBar,
  Button,
  Badge,
  Avatar,
  Tabs,
  EmptyState,
  useToast,
} from '@/components/ui'
import type { TabItem } from '@/components/ui'
import {
  MapPin,
  Calendar,
  Star,
  Briefcase,
  Clock,
} from 'lucide-react'

// --- Types ---
interface CompanyProfile {
  id: string
  profile_id: string
  area: string | null
  status: string
  created_at: string
  profile_nome: string
  profile_avatar: string | null
}

interface OpenJob {
  id: string
  titulo: string
  local: string | null
  valor: number
  data_inicio: string | null
  data_fim: string | null
  categoria: string | null
  urgente: boolean
}

interface Review {
  id: string
  nota: number
  comentario: string | null
  created_at: string
  avaliador: { id: string; nome: string; avatar_url: string | null } | null
  job: { categoria: string | null } | null
}

// --- Helpers ---
function formatMemberSince(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
}

function formatTimeRange(inicio: string | null, fim: string | null) {
  if (!inicio) return 'A definir'
  const s = new Date(inicio)
  const startStr = `${String(s.getHours()).padStart(2, '0')}:${String(s.getMinutes()).padStart(2, '0')}`
  if (!fim) return startStr
  const e = new Date(fim)
  return `${startStr} – ${String(e.getHours()).padStart(2, '0')}:${String(e.getMinutes()).padStart(2, '0')}`
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'A definir'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function formatRelativeTime(dateStr: string) {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Há 1 dia'
  if (diffDays < 7) return `Há ${diffDays} dias`
  if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} semanas`
  return `Há ${Math.floor(diffDays / 30)} meses`
}

function formatHires(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// --- StarRow ---
function StarRow({ nota, size = 14 }: { nota: number; size?: number }) {
  return (
    <span className="flex items-center gap-[2px]">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= nota ? 'text-qe-yellow' : 'text-qe-gray-200'}
          fill="currentColor"
        />
      ))}
    </span>
  )
}

interface EmpresaPerfilPageProps {
  hideTopBar?: boolean
  companyIdOverride?: string
}

// --- Main Component ---
export default function EmpresaPerfilPage({ hideTopBar = false, companyIdOverride }: EmpresaPerfilPageProps = {}) {
  const { companyId: paramCompanyId } = useParams<{ companyId: string }>()
  const companyId = companyIdOverride ?? paramCompanyId
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [loading, setLoading] = React.useState(true)
  const [company, setCompany] = React.useState<CompanyProfile | null>(null)
  const [jobs, setJobs] = React.useState<OpenJob[]>([])
  const [reviews, setReviews] = React.useState<Review[]>([])
  const [totalHires, setTotalHires] = React.useState(0)
  const [showAllReviews, setShowAllReviews] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<string>('vagas')

  React.useEffect(() => {
    if (!companyId) return
    loadProfile()
  }, [companyId])

  async function loadProfile() {
    try {
      setLoading(true)

      const { data: companyRows, error: companyError } = await supabase
        .rpc('get_company_public_profile', { p_company_id: companyId! })

      if (companyError || !companyRows?.length) {
        showToast('Empresa não encontrada', 'error')
        navigate(-1)
        return
      }

      const companyData = companyRows[0] as CompanyProfile
      setCompany(companyData)

      const [jobsRes, reviewsRes, statsRes] = await Promise.all([
        supabase
          .from('jobs')
          .select('id, titulo, local, valor, data_inicio, data_fim, categoria, urgente')
          .eq('company_id', companyId!)
          .eq('status', 'aberta')
          .order('created_at', { ascending: false }),
        supabase
          .from('reviews')
          .select(`
            id, nota, comentario, created_at,
            avaliador:avaliador_id(id, nome, avatar_url),
            job:job_id(categoria)
          `)
          .eq('avaliado_id', companyData.profile_id)
          .order('created_at', { ascending: false }),
        supabase.rpc('get_company_stats', { p_company_id: companyId! }),
      ])

      setJobs((jobsRes.data ?? []) as unknown as OpenJob[])
      setReviews((reviewsRes.data ?? []) as unknown as Review[])

      if (statsRes.data?.[0]) {
        setTotalHires(Number(statsRes.data[0].total_hires))
      }
    } catch (err: any) {
      console.error('Erro ao carregar perfil:', err)
      showToast('Erro ao carregar perfil da empresa', 'error')
    } finally {
      setLoading(false)
    }
  }

  const avgRating = React.useMemo(() => {
    if (!reviews.length) return 0
    return reviews.reduce((acc, r) => acc + r.nota, 0) / reviews.length
  }, [reviews])

  const trustRate = React.useMemo(() => {
    if (!reviews.length) return 0
    return Math.round((reviews.filter((r) => r.nota >= 4).length / reviews.length) * 100)
  }, [reviews])

  const tabs: TabItem[] = [
    { label: `Vagas Disponíveis (${jobs.length})`, value: 'vagas' },
    { label: 'Avaliações', value: 'avaliacoes' },
  ]

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3)

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen bg-qe-bg-page">
        <div className="shimmer h-14 w-full" />
        <div className="shimmer h-48 w-full" />
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
          <div className="flex items-end gap-4 -mt-10">
            <div className="shimmer w-20 h-20 rounded-full shrink-0" />
            <div className="shimmer h-9 w-32 rounded-qe-pill" />
          </div>
          <div className="shimmer h-7 w-48 rounded-qe-md" />
          <div className="shimmer h-5 w-32 rounded-qe-md" />
          <div className="shimmer h-28 rounded-qe-md" />
          <div className="shimmer h-24 rounded-qe-md" />
          <div className="shimmer h-10 rounded-qe-md" />
          <div className="shimmer h-40 rounded-qe-md" />
        </div>
      </div>
    )
  }

  if (!company) return null

  const isVerified = company.status === 'aprovado'

  return (
    <div className="min-h-screen bg-qe-bg-page pb-24 lg:pb-8">
      {/* TopBar — hidden when embedded inside empresa layout (layout provides its own) */}
      {!hideTopBar && (
        <div className="bg-qe-white border-b border-qe-gray-200 sticky top-0 z-20">
          <div className="max-w-5xl mx-auto">
            <TopBar
              variant="inner"
              title={company.profile_nome}
              onBack={() => navigate(-1)}
            />
          </div>
        </div>
      )}

      {/* Banner */}
      <div className="h-48 bg-gradient-to-br from-qe-gray-200 to-qe-gray-400 relative overflow-hidden" />

      {/* Company header */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-end justify-between -mt-10 relative z-10">
          <div className="rounded-full border-4 border-qe-white bg-qe-white shadow-qe-sm overflow-hidden">
            <Avatar
              src={company.profile_avatar ?? undefined}
              name={company.profile_nome}
              size="xl"
              verified={isVerified}
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0 font-bold text-[12px] uppercase tracking-wider"
          >
            <span className="flex items-center gap-1.5">
              <Briefcase size={14} />
              Seguir Empresa
            </span>
          </Button>
        </div>

        <div className="mt-3">
          <h1 className="text-h1 font-bold text-qe-gray-900 leading-tight">
            {company.profile_nome}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <StarRow nota={Math.round(avgRating)} />
            <span className="text-[14px] font-bold text-qe-gray-900">
              {avgRating > 0 ? avgRating.toFixed(1) : '—'}
            </span>
            <span className="text-[14px] text-qe-gray-400">
              · {reviews.length > 0 ? `${reviews.length} avaliações` : 'Sem avaliações ainda'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 mt-6 lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">

        {/* Left column: Sobre Nós + Map + Trust Indicators */}
        <aside className="lg:col-span-4 space-y-4">

          {/* Sobre Nós */}
          <div className="bg-qe-white rounded-qe-md border border-qe-gray-200 p-4 space-y-3 shadow-qe-sm">
            <h2 className="text-[15px] font-bold text-qe-gray-900">Sobre Nós</h2>
            <p className="text-[14px] text-qe-gray-600 leading-relaxed">
              {company.area ?? 'Empresa parceira da plataforma QueroExtra.'}
            </p>
            <div className="pt-2 border-t border-qe-gray-100 space-y-2">
              <div className="flex items-center gap-2 text-[13px] text-qe-gray-500">
                <Calendar size={14} className="text-qe-gray-400 shrink-0" />
                <span>Membro desde {formatMemberSince(company.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Static map placeholder */}
          <div className="rounded-qe-md overflow-hidden border border-qe-gray-200 bg-qe-gray-100 h-36 flex flex-col items-center justify-center gap-2 text-qe-gray-400 shadow-qe-sm">
            <MapPin size={22} />
            <span className="text-[12px] font-medium">Localização</span>
          </div>

          {/* Trust indicators */}
          <div className="bg-qe-white rounded-qe-md border border-qe-gray-200 p-4 space-y-4 shadow-qe-sm">
            {/* Payment velocity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-label text-qe-gray-500 uppercase">
                  Velocidade de Pagamento
                </span>
                <Badge variant="confirmed">Excelente</Badge>
              </div>
              <div className="h-2 bg-qe-gray-100 rounded-full overflow-hidden">
                <div className="h-full w-full bg-qe-success rounded-full" />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-qe-gray-100">
              <div>
                <div className="text-[12px] text-qe-gray-400">Taxa de Confiança</div>
                <div className="text-[22px] font-bold text-qe-gray-900 mt-0.5 leading-none">
                  {reviews.length > 0 ? `${trustRate}%` : '—'}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-qe-gray-400">Contratações Totais</div>
                <div className="text-[22px] font-bold text-qe-gray-900 mt-0.5 leading-none">
                  {formatHires(totalHires)}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right column: Tabs + content */}
        <main className="mt-4 lg:mt-0 lg:col-span-8 space-y-4">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {/* Vagas Disponíveis */}
          {activeTab === 'vagas' && (
            <div className="space-y-3">
              {jobs.length === 0 ? (
                <EmptyState
                  icon={<Briefcase size={40} className="text-qe-gray-300" />}
                  title="Nenhuma vaga aberta"
                  description="Esta empresa não tem vagas abertas no momento."
                />
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-qe-white rounded-qe-md border border-qe-gray-200 p-4 space-y-3 shadow-qe-sm"
                  >
                    <div className="flex flex-wrap gap-2">
                      {job.urgente && <Badge variant="urgent">Urgente</Badge>}
                      {job.categoria && <Badge variant="category">{job.categoria}</Badge>}
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[15px] font-bold text-qe-gray-900">{job.titulo}</h3>
                      <span className="shrink-0 text-[18px] font-bold text-qe-gray-900 leading-none">
                        R$ {job.valor.toLocaleString('pt-BR')}
                        <span className="text-[12px] font-normal text-qe-gray-400"> /turno</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[13px] text-qe-gray-500 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} className="text-qe-gray-400 shrink-0" />
                        {formatTimeRange(job.data_inicio, job.data_fim)}
                      </span>
                      {job.local && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-qe-gray-400 shrink-0" />
                          {job.local}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[12px] text-qe-gray-400">
                      <Calendar size={12} className="shrink-0" />
                      <span className="capitalize">{formatDate(job.data_inicio)}</span>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/extras/vaga/${job.id}`)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Avaliações */}
          {activeTab === 'avaliacoes' && (
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <EmptyState
                  icon={<Star size={40} className="text-qe-gray-300" />}
                  title="Nenhuma avaliação ainda"
                  description="Os freelancers que trabalharem aqui poderão deixar avaliações."
                />
              ) : (
                <>
                  {/* Section title matches mockup */}
                  <h2 className="text-[16px] font-bold text-qe-gray-900">
                    O que dizem os Extras
                  </h2>

                  {visibleReviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-qe-white rounded-qe-md border border-qe-gray-200 p-4 space-y-2.5 shadow-qe-sm"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={review.avaliador?.avatar_url ?? undefined}
                          name={review.avaliador?.nome ?? '?'}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[14px] font-bold text-qe-gray-900 truncate">
                              {review.avaliador?.nome ?? 'Freelancer'}
                            </span>
                            <StarRow nota={review.nota} />
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {review.job?.categoria && (
                              <>
                                <span className="text-[12px] text-qe-gray-500">
                                  {review.job.categoria}
                                </span>
                                <span className="text-qe-gray-300">·</span>
                              </>
                            )}
                            <span className="text-[12px] text-qe-gray-400">
                              {formatRelativeTime(review.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {review.comentario && (
                        <p className="text-[14px] text-qe-gray-600 leading-relaxed">
                          "{review.comentario}"
                        </p>
                      )}
                    </div>
                  ))}

                  {reviews.length > 3 && !showAllReviews && (
                    <button
                      type="button"
                      onClick={() => setShowAllReviews(true)}
                      className="w-full py-3 text-[14px] font-bold text-qe-yellow text-center cursor-pointer hover:opacity-80 transition-opacity min-h-touch"
                    >
                      Ver todas as {reviews.length} avaliações
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
