import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Avatar, Button, useToast, SkeletonCard } from '@/components/ui'
import { Lock, Copy, CheckCircle2, ArrowLeft, Circle, Clock } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AppInfo {
  freelancer_nome:   string
  freelancer_avatar: string | null
  job_titulo:        string
  job_categoria:     string | null
}

interface CheckinRecord {
  id:            string
  tipo:          'checkin' | 'checkout'
  codigo:        string | null
  confirmado_em: string | null
  expira_em:     string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function formatCode(code: string): string {
  return code.split('').join(' ')
}

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Step indicator ────────────────────────────────────────────────────────────

interface StepIndicatorProps {
  checkinDone:  boolean
  checkoutDone: boolean
  activePhase:  'checkin' | 'checkout'
}

function StepIndicator({ checkinDone, checkoutDone, activePhase }: StepIndicatorProps) {
  const checkinActive = activePhase === 'checkin'

  return (
    <div className="flex items-center gap-2">
      {/* Check-In step */}
      <div
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold transition-colors',
          checkinDone
            ? 'bg-qe-success-bg text-qe-success'
            : checkinActive
            ? 'bg-qe-yellow text-qe-black'
            : 'bg-qe-gray-100 text-qe-gray-400',
        ].join(' ')}
      >
        {checkinDone ? <CheckCircle2 size={14} /> : <Circle size={14} />}
        Check-In
      </div>

      {/* Connector */}
      <div className={['flex-1 h-px', checkinDone ? 'bg-qe-success' : 'bg-qe-gray-200'].join(' ')} />

      {/* Check-Out step */}
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
        {!checkinDone ? <Lock size={14} /> : checkoutDone ? <CheckCircle2 size={14} /> : <Circle size={14} />}
        Check-Out
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CheckInHub() {
  const { id: jobId, applicationId } = useParams<{ id: string; applicationId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [appInfo,        setAppInfo]        = React.useState<AppInfo | null>(null)
  const [checkinRecord,  setCheckinRecord]  = React.useState<CheckinRecord | null>(null)
  const [checkoutRecord, setCheckoutRecord] = React.useState<CheckinRecord | null>(null)
  const [loading,        setLoading]        = React.useState(true)
  const [generating,     setGenerating]     = React.useState(false)
  const [copied,         setCopied]         = React.useState(false)
  const [now,            setNow]            = React.useState(() => Date.now())

  // Derived state
  const checkinConfirmed  = !!checkinRecord?.confirmado_em
  const checkoutConfirmed = !!checkoutRecord?.confirmado_em
  const bothDone          = checkinConfirmed && checkoutConfirmed
  const activePhase: 'checkin' | 'checkout' = checkinConfirmed ? 'checkout' : 'checkin'
  const activeRecord = activePhase === 'checkin' ? checkinRecord : checkoutRecord
  const activeCode   = activeRecord?.codigo ?? null
  const isConfirmed  = !!activeRecord?.confirmado_em

  // Countdown
  const secondsLeft = activeRecord?.expira_em && !isConfirmed
    ? Math.max(0, Math.floor((new Date(activeRecord.expira_em).getTime() - now) / 1000))
    : null
  const isExpired = secondsLeft === 0

  // Tick a cada segundo enquanto há código ativo e não confirmado
  React.useEffect(() => {
    if (isConfirmed || bothDone || !activeRecord?.expira_em) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [isConfirmed, bothDone, activeRecord?.expira_em])

  // Auto-regenera quando expira (chave: id + expira_em evita loop)
  const regenKeyRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!isExpired || !activeRecord?.id || !activeRecord?.expira_em || isConfirmed || generating) return
    const key = `${activeRecord.id}:${activeRecord.expira_em}`
    if (regenKeyRef.current === key) return
    regenKeyRef.current = key
    ;(async () => {
      setGenerating(true)
      try {
        const { data, error } = await supabase.rpc('regenerate_checkin_code', {
          p_checkin_id:  activeRecord.id,
          p_novo_codigo: generateCode(),
        })
        if (error) throw error
        if ((data as { success: boolean }).success) await fetchCheckins(false)
      } catch {
        showToast('Erro ao regenerar código.', 'error')
      } finally {
        setGenerating(false)
      }
    })()
  // fetchCheckins via ref para não criar dependência circular
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpired, activeRecord?.id, activeRecord?.expira_em, isConfirmed, generating])

  // ── Data ──────────────────────────────────────────────────────────────────

  const doGenerate = React.useCallback(async (tipo: 'checkin' | 'checkout') => {
    if (!jobId || !applicationId) return
    setGenerating(true)
    try {
      const codigo = generateCode()
      const { data, error } = await supabase
        .from('checkins')
        .insert({ job_id: jobId, application_id: applicationId, codigo, tipo })
        .select('id, tipo, codigo, confirmado_em, expira_em')
        .single()

      if (error) throw error
      const record = data as CheckinRecord
      if (tipo === 'checkin') setCheckinRecord(record)
      else                    setCheckoutRecord(record)
    } catch {
      showToast('Erro ao gerar código.', 'error')
    } finally {
      setGenerating(false)
    }
  }, [jobId, applicationId, showToast])

  const fetchCheckins = React.useCallback(async (generateCheckinIfMissing = false) => {
    if (!jobId || !applicationId) return
    try {
      const { data, error } = await supabase
        .from('checkins')
        .select('id, tipo, codigo, confirmado_em, expira_em')
        .eq('application_id', applicationId)
        .eq('job_id', jobId)

      if (error) throw error

      const records = (data ?? []) as CheckinRecord[]
      const checkin  = records.find((r) => r.tipo === 'checkin')  ?? null
      const checkout = records.find((r) => r.tipo === 'checkout') ?? null

      setCheckinRecord(checkin)
      setCheckoutRecord(checkout)

      if (generateCheckinIfMissing && !checkin) {
        await doGenerate('checkin')
      }
    } catch {
      showToast('Erro ao carregar registros.', 'error')
    }
  }, [jobId, applicationId, doGenerate, showToast])

  // Initial load
  React.useEffect(() => {
    if (!jobId || !applicationId) return

    const load = async () => {
      try {
        // App info
        const { data: appData, error: appErr } = await supabase
          .from('applications')
          .select(`
            id,
            job_id,
            jobs!inner(titulo, categoria),
            freelancers!inner(
              profiles!inner(nome, avatar_url)
            )
          `)
          .eq('id', applicationId)
          .single()

        if (appErr) throw appErr

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = appData as any
        setAppInfo({
          freelancer_nome:   raw.freelancers?.profiles?.nome    ?? 'Freelancer',
          freelancer_avatar: raw.freelancers?.profiles?.avatar_url ?? null,
          job_titulo:        raw.jobs?.titulo    ?? '',
          job_categoria:     raw.jobs?.categoria ?? null,
        })

        // Checkins + gera checkin se ainda não existe
        await fetchCheckins(true)
      } catch {
        showToast('Erro ao carregar dados.', 'error')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [jobId, applicationId, fetchCheckins, showToast])

  // Real-time: detect freelancer confirmation
  React.useEffect(() => {
    if (!applicationId) return
    const channel = supabase
      .channel(`checkin-hub-${applicationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkins',
          filter: `application_id=eq.${applicationId}`,
        },
        () => { fetchCheckins(false) }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [applicationId, fetchCheckins])

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleCopy = async () => {
    if (!activeCode) return
    try {
      await navigator.clipboard.writeText(activeCode)
      setCopied(true)
      showToast('Código copiado!', 'success')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      showToast('Não foi possível copiar.', 'error')
    }
  }

  const backPath = `/empresa/vagas/${jobId}?tab=candidatos&candidatoStatus=aprovado`

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div className="h-20 shimmer rounded-qe-md" />
        <div className="h-8  shimmer rounded-qe-md" />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">

      {/* ── Botão voltar (desktop only — mobile tem TopBar) ── */}
      <button
        type="button"
        onClick={() => navigate(backPath)}
        className="hidden lg:flex items-center gap-2 text-[14px] text-qe-gray-500 font-bold hover:text-qe-gray-700 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Voltar aos Candidatos
      </button>

      {/* ── Freelancer info card ── */}
      {appInfo && (
        <div className="flex items-center gap-4 p-4 bg-qe-white rounded-qe-md border border-qe-gray-200 shadow-qe-sm">
          <Avatar
            src={appInfo.freelancer_avatar || undefined}
            name={appInfo.freelancer_nome}
            size="md"
            verified
          />
          <div className="min-w-0">
            <p className="text-[16px] font-bold text-qe-gray-900 truncate">{appInfo.freelancer_nome}</p>
            <p className="text-[13px] text-qe-gray-500 truncate">
              {appInfo.job_categoria || appInfo.job_titulo}
            </p>
          </div>
        </div>
      )}

      {/* ── Step indicator ── */}
      <StepIndicator
        checkinDone={checkinConfirmed}
        checkoutDone={checkoutConfirmed}
        activePhase={activePhase}
      />

      {/* ── Code card ── */}
      {bothDone ? (
        /* ── All done state ── */
        <div className="bg-qe-white rounded-qe-md border border-qe-success/30 p-10 shadow-qe-sm flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 rounded-full bg-qe-success-bg flex items-center justify-center">
            <CheckCircle2 size={32} className="text-qe-success" />
          </div>
          <div>
            <p className="text-[20px] font-bold text-qe-gray-900">Turno concluído!</p>
            <p className="text-[14px] text-qe-gray-500 mt-1 leading-relaxed">
              Check-in e check-out confirmados com sucesso.
            </p>
          </div>
          <Button variant="secondary" size="md" onClick={() => navigate(backPath)}>
            Voltar ao painel
          </Button>
        </div>
      ) : (
        /* ── Active code card ── */
        <div className="bg-qe-white rounded-qe-md border border-qe-gray-200 p-8 shadow-qe-sm flex flex-col items-center gap-6 text-center">

          {isConfirmed ? (
            /* Phase confirmed, waiting for next */
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 size={40} className="text-qe-success" />
              <p className="text-[16px] font-bold text-qe-success">
                {activePhase === 'checkin' ? 'Check-In confirmado!' : 'Check-Out confirmado!'}
              </p>
              <p className="text-[13px] text-qe-gray-500 leading-relaxed max-w-xs">
                {activePhase === 'checkin'
                  ? 'Agora gere o código de check-out ao final do turno.'
                  : 'Turno em processo de conclusão.'}
              </p>
            </div>
          ) : generating || !activeCode ? (
            /* Generating */
            <div className="py-6 space-y-3">
              <div className="h-14 w-64 shimmer rounded-qe-md mx-auto" />
              <p className="text-[13px] text-qe-gray-400">Gerando código...</p>
            </div>
          ) : (
            /* Code display */
            <>
              <div className="space-y-2 w-full">
                <p className="text-[11px] font-bold text-qe-gray-400 uppercase tracking-widest">
                  Código de {activePhase === 'checkin' ? 'Check-In' : 'Check-Out'}
                </p>

                <div className="bg-qe-gray-50 border border-qe-gray-100 rounded-qe-md px-4 py-4 lg:px-6 lg:py-5 mx-auto inline-block">
                  <p
                    className="text-[32px] lg:text-[44px] font-bold text-qe-gray-900 leading-none tracking-[0.18em] tabular-nums whitespace-nowrap"
                    aria-label={`Código: ${activeCode}`}
                  >
                    {formatCode(activeCode)}
                  </p>
                </div>
              </div>

              {/* Countdown */}
              {secondsLeft !== null && (
                <div className={[
                  'flex items-center gap-1.5 text-[13px] font-bold tabular-nums',
                  secondsLeft > 300 ? 'text-qe-success'  :
                  secondsLeft > 60  ? 'text-qe-warning'  :
                                      'text-qe-error',
                ].join(' ')}>
                  <Clock size={13} />
                  Expira em {formatCountdown(secondsLeft)}
                </div>
              )}

              {/* Lock icon */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-qe-gray-100">
                <Lock size={18} className="text-qe-gray-400" />
              </div>

              {/* Instruction */}
              <p className="text-[13px] text-qe-gray-500 leading-relaxed max-w-xs">
                {activePhase === 'checkin'
                  ? 'Informe este código ao prestador de serviço para validar o início do trabalho.'
                  : 'Informe este código ao prestador de serviço para confirmar o encerramento do turno.'}
              </p>

              {/* Buttons */}
              <div className="w-full space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  leadingIcon={<Copy size={16} />}
                  onClick={handleCopy}
                >
                  {copied ? 'Copiado!' : 'Copiar código'}
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  className="w-full border border-qe-gray-200"
                  onClick={() => navigate(backPath)}
                >
                  Voltar ao painel
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
