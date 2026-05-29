import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button, InputOTP, TopBar, useToast, SkeletonCard } from '@/components/ui'
import {
  ArrowLeft,
  CheckCircle2,
  Briefcase,
  Coffee,
  GlassWater,
  AlertCircle,
  Lock,
} from 'lucide-react'
import { ReviewModal } from '@/components/ReviewModal/ReviewModal'
import { createPendingReview } from '@/hooks/useReviews'

// ── Types ──────────────────────────────────────────────────────────────────────

interface TurnoInfo {
  job_titulo:         string
  job_categoria:      string | null
  company_nome:       string
  company_profile_id: string
  job_id:             string
}

interface CheckinRecord {
  id:            string
  tipo:          'checkin' | 'checkout'
  confirmado_em: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function CategoryIcon({ categoria }: { categoria: string | null }) {
  const cat = categoria?.toLowerCase() ?? ''
  if (cat.includes('garço') || cat.includes('atend'))
    return <Coffee size={22} className="text-qe-gray-500" />
  if (cat.includes('bar') || cat.includes('drink'))
    return <GlassWater size={22} className="text-qe-gray-500" />
  return <Briefcase size={22} className="text-qe-gray-500" />
}

// ── Step indicator ────────────────────────────────────────────────────────────

interface StepIndicatorProps {
  checkinDone:  boolean
  checkoutDone: boolean
  activePhase:  'checkin' | 'checkout'
}

function StepIndicator({ checkinDone, checkoutDone, activePhase }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold transition-colors',
          checkinDone
            ? 'bg-qe-success-bg text-qe-success'
            : activePhase === 'checkin'
            ? 'bg-qe-yellow text-qe-black'
            : 'bg-qe-gray-100 text-qe-gray-400',
        ].join(' ')}
      >
        {checkinDone ? <CheckCircle2 size={14} /> : <Lock size={14} />}
        Check-In
      </div>

      <div className={['flex-1 h-px', checkinDone ? 'bg-qe-success' : 'bg-qe-gray-200'].join(' ')} />

      <div
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold transition-colors',
          checkoutDone
            ? 'bg-qe-success-bg text-qe-success'
            : !checkinDone
            ? 'bg-qe-gray-100 text-qe-gray-400'
            : activePhase === 'checkout'
            ? 'bg-qe-yellow text-qe-black'
            : 'bg-qe-gray-100 text-qe-gray-400',
        ].join(' ')}
      >
        {!checkinDone ? <Lock size={14} /> : checkoutDone ? <CheckCircle2 size={14} /> : <Lock size={14} />}
        Check-Out
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FreelancerCheckinPage() {
  const { applicationId } = useParams<{ applicationId: string }>()
  const navigate           = useNavigate()
  const { showToast }      = useToast()
  const { profile }        = useAuth()

  const [turnoInfo,       setTurnoInfo]       = React.useState<TurnoInfo | null>(null)
  const [checkinRecord,   setCheckinRecord]   = React.useState<CheckinRecord | null>(null)
  const [checkoutRecord,  setCheckoutRecord]  = React.useState<CheckinRecord | null>(null)
  const [loading,         setLoading]         = React.useState(true)
  const [validating,      setValidating]      = React.useState(false)
  const [codeError,       setCodeError]       = React.useState<string | null>(null)
  const [code,            setCode]            = React.useState('')
  const [otpKey,          setOtpKey]          = React.useState(0)

  // Review state
  const [reviewOpen,  setReviewOpen]  = React.useState(false)
  const [reviewId,    setReviewId]    = React.useState<string | null>(null)
  const reviewTriggeredRef = React.useRef(false)

  // Derived
  const checkinConfirmed  = !!checkinRecord?.confirmado_em
  const checkoutConfirmed = !!checkoutRecord?.confirmado_em
  const bothDone          = checkinConfirmed && checkoutConfirmed
  const activePhase: 'checkin' | 'checkout' = checkinConfirmed ? 'checkout' : 'checkin'

  // When checkout is confirmed: create pending review stub and open modal
  React.useEffect(() => {
    if (!bothDone || reviewTriggeredRef.current || !turnoInfo || !profile) return
    reviewTriggeredRef.current = true
    ;(async () => {
      const id = await createPendingReview(
        turnoInfo.job_id,
        profile.id,
        turnoInfo.company_profile_id,
      )
      if (id) { setReviewId(id); setReviewOpen(true) }
    })()
  }, [bothDone, turnoInfo, profile])

  const backPath = '/extras/extras'

  // ── Data ──────────────────────────────────────────────────────────────────

  const fetchCheckins = React.useCallback(async () => {
    if (!applicationId) return
    const { data } = await supabase
      .from('checkins')
      .select('id, tipo, confirmado_em')
      .eq('application_id', applicationId)
    if (!data) return
    const records = data as CheckinRecord[]
    setCheckinRecord(records.find((r) => r.tipo === 'checkin')  ?? null)
    setCheckoutRecord(records.find((r) => r.tipo === 'checkout') ?? null)
  }, [applicationId])

  React.useEffect(() => {
    if (!applicationId) return
    const load = async () => {
      // Fetch ambos em paralelo — checkins não depende do turnoInfo
      const [appResult] = await Promise.all([
        supabase
          .from('applications')
          .select(`
            job_id,
            jobs!inner(
              id,
              titulo,
              categoria,
              companies(
                profiles(id, nome)
              )
            )
          `)
          .eq('id', applicationId)
          .single(),
        fetchCheckins(),
      ])

      if (!appResult.error && appResult.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = appResult.data as any
        setTurnoInfo({
          job_titulo:         raw.jobs?.titulo    ?? '',
          job_categoria:      raw.jobs?.categoria ?? null,
          company_nome:       raw.jobs?.companies?.profiles?.nome ?? 'Estabelecimento',
          company_profile_id: raw.jobs?.companies?.profiles?.id  ?? '',
          job_id:             raw.jobs?.id ?? raw.job_id ?? '',
        })
      }

      setLoading(false)
    }
    load()
  }, [applicationId, fetchCheckins, showToast])

  // Realtime: detecta quando empresa gera o código de checkout
  React.useEffect(() => {
    if (!applicationId) return
    const channel = supabase
      .channel(`freelancer-checkin-${applicationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkins',
          filter: `application_id=eq.${applicationId}`,
        },
        () => { fetchCheckins() }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [applicationId, fetchCheckins])

  // ── Validate ─────────────────────────────────────────────────────────────

  const resetOtp = () => {
    setCode('')
    setOtpKey((k) => k + 1)
  }

  const handleValidate = async (inputCode: string) => {
    if (inputCode.length !== 6 || validating) return
    setValidating(true)
    setCodeError(null)
    try {
      const { data, error } = await supabase.rpc('confirm_checkin', {
        p_application_id: applicationId,
        p_tipo:           activePhase,
        p_codigo:         inputCode,
      })
      if (error) throw error

      const result = data as { success: boolean; error?: string }

      if (!result.success) {
        const msg =
          result.error === 'invalid_code'       ? 'Código incorreto. Tente novamente.'              :
          result.error === 'expired'            ? 'Código expirado. Peça um novo código à empresa.' :
          result.error === 'already_confirmed'  ? 'Este código já foi utilizado.'                   :
          result.error === 'unauthorized'       ? 'Acesso não autorizado.'                          :
                                                  'Erro ao validar. Tente novamente.'
        setCodeError(msg)
        resetOtp()
        return
      }

        // After successful confirmation, update application status
        const newStatus = activePhase === 'checkin' ? 'em_andamento' : 'concluido';
        const { error: statusError } = await supabase
          .from('applications')
          .update({ status: newStatus })
          .eq('id', applicationId);
        if (statusError) {
          console.error('Erro ao atualizar status da aplicação:', statusError);
          showToast('Erro ao atualizar status da aplicação.', 'error');
        }
    } catch {
      setCodeError('Erro ao validar. Tente novamente.')
      resetOtp()
    } finally {
      setValidating(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="h-10 shimmer rounded-qe-md" />
        <div className="h-20 shimmer rounded-qe-md" />
        <SkeletonCard />
      </div>
    )
  }

  const showOtpCard =
    !bothDone &&
    !!checkinRecord &&
    !(checkinConfirmed && !checkoutRecord)

  return (
    <div className="min-h-screen bg-qe-bg-page flex flex-col">

      {/* Review modal triggered after checkout */}
      {reviewId && turnoInfo && (
        <ReviewModal
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          reviewId={reviewId}
          avaliadoNome={turnoInfo.company_nome}
          avaliadoAvatar={null}
          jobTitulo={turnoInfo.job_titulo}
          onDone={() => setReviewOpen(false)}
        />
      )}

      {/* TopBar mobile */}
      <div className="lg:hidden sticky top-0 z-40">
        <TopBar
          variant="inner"
          title="Check-in / Check-out"
          onBack={() => navigate(backPath)}
        />
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6 pb-32 lg:pb-8">

        {/* Botão voltar desktop */}
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="hidden lg:flex items-center gap-2 text-[14px] text-qe-gray-500 font-bold hover:text-qe-gray-700 cursor-pointer"
        >
          <ArrowLeft size={16} />
          Voltar aos Meus Extras
        </button>

        {/* Título da página */}
        <div className="text-center space-y-1.5">
          <h1 className="text-[22px] font-bold text-qe-gray-900">Validar Turno</h1>
          <p className="text-[14px] text-qe-gray-500 leading-relaxed max-w-sm mx-auto">
            Insira o código de 6 dígitos fornecido pelo estabelecimento para registrar seu ponto.
          </p>
        </div>

        {/* Card do turno */}
        {turnoInfo && (
          <div className="bg-qe-white rounded-qe-md border border-qe-gray-200 p-4 shadow-qe-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-qe-gray-50 border border-qe-gray-100 rounded-qe-sm flex items-center justify-center shrink-0">
              <CategoryIcon categoria={turnoInfo.job_categoria} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-qe-gray-400 uppercase tracking-widest mb-0.5">
                Turno Atual
              </p>
              <p className="text-[15px] font-bold text-qe-gray-900 truncate">{turnoInfo.job_titulo}</p>
              <p className="text-[13px] text-qe-gray-500 truncate">{turnoInfo.company_nome}</p>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <StepIndicator
          checkinDone={checkinConfirmed}
          checkoutDone={checkoutConfirmed}
          activePhase={activePhase}
        />

        {/* Estados */}
        {bothDone ? (
          /* Turno concluído */
          <div className="bg-qe-white rounded-qe-md border border-qe-success/30 p-10 shadow-qe-sm flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-qe-success-bg flex items-center justify-center">
              <CheckCircle2 size={32} className="text-qe-success" />
            </div>
            <div>
              <p className="text-[20px] font-bold text-qe-gray-900">Turno concluído!</p>
              <p className="text-[14px] text-qe-gray-500 mt-1 leading-relaxed max-w-xs">
                Check-in e check-out confirmados. O valor do turno foi creditado na sua carteira.
              </p>
            </div>
            <Button variant="secondary" size="md" onClick={() => navigate('/extras/extras')}>
              Ver Meus Extras
            </Button>
          </div>
        ) : !checkinRecord ? (
          /* Aguardando empresa gerar código */
          <div className="bg-qe-white rounded-qe-md border border-qe-gray-200 p-8 shadow-qe-sm flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-qe-gray-100 flex items-center justify-center">
              <Lock size={22} className="text-qe-gray-400" />
            </div>
            <div>
              <p className="text-[16px] font-bold text-qe-gray-900">Aguardando código</p>
              <p className="text-[13px] text-qe-gray-500 mt-1 leading-relaxed max-w-xs">
                A empresa ainda não gerou o código de check-in. A tela atualizará automaticamente quando estiver pronto.
              </p>
            </div>
          </div>
        ) : checkinConfirmed && !checkoutRecord ? (
          /* Check-in confirmado, aguardando código de checkout */
          <div className="bg-qe-white rounded-qe-md border border-qe-success/30 p-8 shadow-qe-sm flex flex-col items-center gap-4 text-center">
            <CheckCircle2 size={36} className="text-qe-success" />
            <div>
              <p className="text-[16px] font-bold text-qe-success">Check-in confirmado!</p>
              <p className="text-[13px] text-qe-gray-500 mt-1 leading-relaxed max-w-xs">
                Turno em andamento. Ao final, o estabelecimento fornecerá o código de check-out.
              </p>
            </div>
          </div>
        ) : (
          /* Card de entrada do código */
          <div className="bg-qe-white rounded-qe-md border border-qe-gray-200 p-6 shadow-qe-sm flex flex-col items-center gap-5">
            <p className="text-[11px] font-bold text-qe-gray-400 uppercase tracking-widest">
              Código de {activePhase === 'checkin' ? 'Check-In' : 'Check-Out'}
            </p>

            <InputOTP
              key={otpKey}
              length={6}
              autoFocus
              disabled={validating}
              onChange={(c) => { setCode(c); setCodeError(null) }}
              onComplete={handleValidate}
            />

            {codeError && (
              <div className="flex items-center gap-2 text-qe-error text-[13px]" role="alert" aria-live="polite">
                <AlertCircle size={14} className="shrink-0" />
                {codeError}
              </div>
            )}

            {validating && (
              <p className="text-[13px] text-qe-gray-400">Validando...</p>
            )}
          </div>
        )}
      </div>

      {/* Rodapé fixo com botão VALIDAR */}
      {showOtpCard && (
        <div className="fixed bottom-0 left-0 right-0 bg-qe-white border-t border-qe-gray-200 px-4 py-4 z-30">
          <div className="max-w-lg mx-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full font-bold"
              disabled={code.length < 6 || validating}
              loading={validating}
              onClick={() => handleValidate(code)}
            >
              Validar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
