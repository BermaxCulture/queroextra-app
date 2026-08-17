import { useEffect, useRef, useState } from 'react'
import {
  StatCard,
  Button,
  EmptyState,
  ResponsiveSheet,
  Select,
  useToast,
} from '@/components/ui'
import {
  Wallet,
  TrendingUp,
  Download,
  AlertCircle,
  FileSpreadsheet,
  Clock,
  CheckCircle,
  ArrowUpRight,
  MessageCircleWarning,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

type TransactionStatus = 'pendente' | 'retido' | 'liberado' | 'sacado' | 'estornado'

type CompanyTransaction = {
  id: string
  valor_bruto: number
  status: TransactionStatus
  em_disputa: boolean
  created_at: string
  jobs: { titulo: string } | null
}

// Status em que ainda faz sentido reportar um problema — 'pendente' nem foi
// pago ainda, 'sacado'/'estornado' já são estado terminal (a ValidaPay já
// valida a titularidade da chave PIX no saque, então não há o que reverter
// depois de sacado).
const DISPUTABLE_STATUSES: TransactionStatus[] = ['retido', 'liberado']

const PAID_STATUSES: TransactionStatus[] = ['retido', 'liberado', 'sacado']

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function getStatusDisplay(status: TransactionStatus) {
  switch (status) {
    case 'pendente':
      return { label: 'Aguardando Pagamento', color: 'text-qe-gray-500', icon: <Clock size={14} className="text-qe-gray-400" /> }
    case 'retido':
      return { label: 'Pago — Aguardando Checkout', color: 'text-amber-600', icon: <Clock size={14} className="text-amber-500" /> }
    case 'liberado':
      return { label: 'Pago — Liberado ao Freelancer', color: 'text-qe-success', icon: <CheckCircle size={14} className="text-qe-success" /> }
    case 'sacado':
      return { label: 'Pago — Sacado pelo Freelancer', color: 'text-blue-500', icon: <ArrowUpRight size={14} className="text-blue-500" /> }
    case 'estornado':
      return { label: 'Estornado', color: 'text-red-500', icon: <AlertCircle size={14} className="text-red-500" /> }
    default:
      return { label: status, color: 'text-qe-gray-500', icon: <Clock size={14} /> }
  }
}

export default function EmpresaCarteira() {
  const { company } = useAuth()
  const { showToast } = useToast()
  const loadedRef = useRef(false)

  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<CompanyTransaction[]>([])

  const [isDisputeOpen, setIsDisputeOpen] = useState(false)
  const [disputeTxId, setDisputeTxId] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [submittingDispute, setSubmittingDispute] = useState(false)

  useEffect(() => {
    if (company?.id && !loadedRef.current) {
      loadedRef.current = true
      loadData(company.id)
    }
  }, [company?.id])

  async function loadData(companyId: string) {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('transactions')
        .select('id, valor_bruto, status, em_disputa, created_at, jobs!inner(titulo, company_id)')
        .eq('jobs.company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransactions((data as unknown as CompanyTransaction[]) || [])
    } catch (err) {
      console.error('Erro ao carregar carteira da empresa:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const disputableTransactions = transactions.filter(
    (t) => DISPUTABLE_STATUSES.includes(t.status) && !t.em_disputa
  )
  const disputeOptions = disputableTransactions.map((t) => ({
    value: t.id,
    label: `${t.jobs?.titulo || 'Trabalho Extra'} · ${formatCurrency(Number(t.valor_bruto))} · ${new Date(t.created_at).toLocaleDateString('pt-BR')}`,
  }))

  function openDisputeSheet() {
    setDisputeTxId(disputableTransactions[0]?.id ?? '')
    setIsDisputeOpen(true)
  }

  async function handleOpenDispute() {
    if (!disputeTxId || !disputeReason.trim()) return
    setSubmittingDispute(true)
    try {
      const { data, error } = await supabase.functions.invoke('open-dispute', {
        body: { transaction_id: disputeTxId, motivo: disputeReason.trim() },
      })
      if (error) throw new Error(error.message || 'Erro ao abrir disputa')
      if (data?.error) throw new Error(data.error)

      setTransactions((prev) =>
        prev.map((t) => (t.id === disputeTxId ? { ...t, em_disputa: true } : t))
      )
      showToast('Disputa registrada! Nosso suporte vai analisar e entrar em contato.', 'success')
      setIsDisputeOpen(false)
      setDisputeTxId('')
      setDisputeReason('')
    } catch (err: any) {
      showToast(err.message || 'Erro ao registrar a disputa', 'error')
    } finally {
      setSubmittingDispute(false)
    }
  }

  const totalPago = transactions
    .filter((t) => PAID_STATUSES.includes(t.status))
    .reduce((acc, t) => acc + Number(t.valor_bruto), 0)

  const turnosPagos = transactions.filter((t) => PAID_STATUSES.includes(t.status)).length

  const pendentesFechamento = transactions
    .filter((t) => t.status === 'retido')
    .reduce((acc, t) => acc + Number(t.valor_bruto), 0)

  function handleExportCsv() {
    const header = ['Turno', 'Status', 'Data', 'Valor (R$)']
    const rows = transactions.map((tx) => [
      tx.jobs?.titulo || 'Trabalho Extra',
      getStatusDisplay(tx.status).label,
      new Date(tx.created_at).toLocaleDateString('pt-BR'),
      Number(tx.valor_bruto).toFixed(2).replace('.', ','),
    ])

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\r\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `carteira-queroextra-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1 className="text-h1 font-bold text-qe-gray-900">Minha Carteira</h1>
        <p className="text-[14px] text-qe-gray-500 mt-1">
          Acompanhe suas despesas de contratação e histórico financeiro.
        </p>
      </div>

      {/* Alerta de pagamento via PIX */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-qe-md p-4 max-w-3xl">
        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
        <div className="text-[13px] text-amber-800 leading-relaxed">
          <strong>Pagamento via Pix pela plataforma:</strong> Ao aprovar um candidato, você gera o
          Pix diretamente aqui no QueroExtra. O valor fica retido até a confirmação do checkout e
          então é liberado automaticamente para o freelancer.
        </div>
      </div>

      {/* Grade Financeira */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Pago em Extras"
          value={isLoading ? '—' : formatCurrency(totalPago)}
          subtext="Histórico acumulado"
          icon={<TrendingUp size={16} className="text-qe-success" />}
        />
        <StatCard
          label="Turnos Pagos"
          value={isLoading ? '—' : String(turnosPagos)}
          subtext="Profissionais contratados"
        />
        <StatCard
          label="Pendentes de Fechamento"
          value={isLoading ? '—' : formatCurrency(pendentesFechamento)}
          subtext="Retido até o checkout"
          icon={<Wallet size={16} className="text-qe-yellow" />}
        />
      </section>

      {/* Card de Suporte */}
      <div className="flex items-start gap-4 bg-white border border-qe-gray-200 rounded-qe-md p-5 shadow-qe-sm max-w-3xl">
        <div className="w-11 h-11 shrink-0 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
          <MessageCircleWarning size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-qe-gray-900">Precisa de ajuda?</h3>
          <p className="text-[13px] text-qe-gray-500 mt-0.5">
            Teve algum problema com um pagamento? Fale com nosso suporte.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0"
          disabled={isLoading || disputableTransactions.length === 0}
          onClick={openDisputeSheet}
        >
          Reportar problema
        </Button>
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-qe-md border border-qe-gray-200 p-6 md:p-8 space-y-6 shadow-qe-sm">
        <div className="flex justify-between items-center pb-4 border-b border-qe-gray-100">
          <div>
            <h3 className="text-[16px] font-bold text-qe-gray-900">Histórico de Lançamentos</h3>
            <p className="text-[12px] text-qe-gray-400 mt-0.5">Seus turnos finalizados e valores</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-[12px] font-bold text-qe-gray-500 hover:text-qe-gray-700"
            disabled={isLoading || transactions.length === 0}
            onClick={handleExportCsv}
          >
            <Download size={14} /> Exportar CSV
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-qe-gray-50 rounded-qe-sm animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<FileSpreadsheet size={40} className="text-qe-gray-300" />}
            title="Sem movimentações recentes"
            description="Você ainda não possui turnos concluídos ou faturados."
          />
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const st = getStatusDisplay(tx.status)
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 p-3.5 bg-qe-gray-50 border border-qe-gray-100 rounded-qe-sm"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-qe-gray-900 truncate">
                      {tx.jobs?.titulo || 'Trabalho Extra'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {st.icon}
                      <span className={`text-[12px] font-medium ${st.color}`}>{st.label}</span>
                      <span className="text-qe-gray-300">•</span>
                      <span className="text-[12px] text-qe-gray-400">
                        {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {tx.em_disputa && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-qe-pill">
                        <MessageCircleWarning size={11} /> Disputa em análise
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-[14px] font-bold text-qe-gray-900">
                    {formatCurrency(Number(tx.valor_bruto))}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Reportar problema (modal no desktop, bottom sheet no mobile) ────── */}
      <ResponsiveSheet
        open={isDisputeOpen}
        onClose={() => { setIsDisputeOpen(false); setDisputeTxId(''); setDisputeReason('') }}
        title="Reportar problema"
      >
        <div className="p-6 space-y-4">
          <p className="text-[13px] text-qe-gray-500">
            Conte pra gente o que aconteceu. Nosso suporte vai analisar e entrar em contato para
            resolver — inclusive reembolso, se for o caso.
          </p>

          <Select
            label="Qual turno?"
            value={disputeTxId}
            onChange={setDisputeTxId}
            options={disputeOptions}
            placeholder="Selecione o turno..."
          />

          <div>
            <label className="text-[13px] font-semibold text-qe-gray-700 block mb-1.5">O que aconteceu?</label>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Ex: o freelancer não compareceu / saiu antes do fim do turno..."
              rows={4}
              className="w-full border-[1.5px] border-qe-gray-200 rounded-qe-sm px-3.5 py-2.5 text-[14px] font-sans text-qe-gray-900 placeholder:text-qe-gray-400 outline-none focus:border-qe-yellow focus:shadow-[0_0_0_3px_rgba(245,192,0,0.15)] resize-none transition-all"
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!disputeTxId || !disputeReason.trim()}
            loading={submittingDispute}
            onClick={handleOpenDispute}
          >
            Enviar para o suporte
          </Button>
        </div>
      </ResponsiveSheet>
    </div>
  )
}
