import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar, Button, BottomSheet, Input, Select, useToast, EmptyState } from '@/components/ui'
import {
  Wallet, Clock, CheckCircle, Settings, Landmark, History,
  ArrowDownToLine, ArrowUpRight, Info, AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

type Transaction = {
  id: string
  valor_liquido: number
  status: 'pendente' | 'retido' | 'liberado' | 'sacado'
  created_at: string
  jobs?: { titulo: string }
}

// ── Skeletons ────────────────────────────────────────────────────────────────
function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-7 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-20 bg-gray-100 rounded" />
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-200" />
      </div>
    </div>
  )
}

function SkeletonTxRow() {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 bg-gray-200 rounded" />
        <div className="h-3 w-28 bg-gray-100 rounded" />
      </div>
      <div className="h-5 w-16 bg-gray-200 rounded ml-4" />
    </div>
  )
}

// ── Tooltip de Info ──────────────────────────────────────────────────────────
function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={() => setOpen(v => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Mais informações"
      >
        <Info size={15} />
      </button>
      {open && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-56 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl z-50 leading-relaxed">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}

// ── Saldo Card customizado ───────────────────────────────────────────────────
function SaldoCard({
  label, value, subtext, icon, tooltip,
}: {
  label: string
  value: string
  subtext: string
  icon: React.ReactNode
  tooltip?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
            {tooltip && <InfoTooltip text={tooltip} />}
          </div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-400 mt-1">{subtext}</div>
        </div>
        <div className="flex-shrink-0">{icon}</div>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export function CarteirePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  // ── Evita refetch toda vez que o componente monta ──
  const loadedRef = useRef(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [isSavingPix, setIsSavingPix] = useState(false)

  const [saldoDisponivel, setSaldoDisponivel] = useState(0)
  const [saldoRetido, setSaldoRetido] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [freelancerId, setFreelancerId] = useState<string | null>(null)
  const [pixKey, setPixKey] = useState('')
  const [pixKeyType, setPixKeyType] = useState('CPF')

  // Saque — valor escolhido
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const withdrawAmountNum = parseFloat(withdrawAmount) || 0
  const withdrawAmountValid = withdrawAmountNum > 0 && withdrawAmountNum <= saldoDisponivel

  useEffect(() => {
    if (user && !loadedRef.current) {
      loadedRef.current = true
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setIsLoading(true)

      const { data: freelancerData, error: freelancerError } = await supabase
        .from('freelancers')
        .select('id, pix_key, pix_key_type')
        .eq('profile_id', user!.id)
        .single()

      if (freelancerError) throw freelancerError

      setFreelancerId(freelancerData.id)
      if (freelancerData.pix_key) {
        setPixKey(freelancerData.pix_key)
        setPixKeyType(freelancerData.pix_key_type || 'CPF')
      }

      const { data: applications } = await supabase
        .from('applications')
        .select('id')
        .eq('freelancer_id', freelancerData.id)

      if (applications && applications.length > 0) {
        const appIds = applications.map(a => a.id)

        const { data: txs, error: txsError } = await supabase
          .from('transactions')
          .select('id, valor_liquido, status, created_at, jobs:job_id (titulo)')
          .in('application_id', appIds)
          .order('created_at', { ascending: false })

        if (txsError) throw txsError

        const typedTxs = (txs as any[]) || []
        setTransactions(typedTxs)

        setSaldoDisponivel(
          typedTxs.filter(t => t.status === 'liberado').reduce((acc, t) => acc + Number(t.valor_liquido), 0)
        )
        setSaldoRetido(
          typedTxs.filter(t => t.status === 'retido').reduce((acc, t) => acc + Number(t.valor_liquido), 0)
        )
      } else {
        setTransactions([])
        setSaldoDisponivel(0)
        setSaldoRetido(0)
      }
    } catch (error) {
      console.error('Erro ao carregar carteira:', error)
      showToast('Não foi possível carregar sua carteira', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const openWithdrawSheet = () => {
    if (!pixKey) {
      showToast('Configure sua chave PIX antes de sacar', 'info')
      setIsConfigOpen(true)
      return
    }
    setWithdrawAmount(formatCurrencyRaw(saldoDisponivel))
    setIsWithdrawOpen(true)
  }

  const handleWithdraw = async () => {
    if (!withdrawAmountValid) return

    try {
      setIsWithdrawing(true)

      const { data, error } = await supabase.functions.invoke('request-withdrawal', {
        body: { amount: withdrawAmountNum },
      })

      if (error) throw new Error(error.message || 'Erro ao processar saque')
      if (data?.error) throw new Error(data.error)

      showToast('Saque solicitado com sucesso!', 'success')
      setIsWithdrawOpen(false)

      // Refetch manual após saque
      loadedRef.current = false
      await loadData()
      loadedRef.current = true
    } catch (error: any) {
      showToast(error.message || 'Erro ao solicitar saque', 'error')
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleSimulateWithdrawal = async () => {
    try {
      setIsWithdrawing(true)
      const { data, error } = await supabase.functions.invoke('simulate-withdrawal')
      if (error) throw new Error(error.message || 'Erro ao simular saque')
      if (data?.error) throw new Error(data.error)
      showToast('Saque simulado com sucesso! 🧪', 'success')
      setIsWithdrawOpen(false)
      loadedRef.current = false
      await loadData()
      loadedRef.current = true
    } catch (err: any) {
      showToast(err.message || 'Erro ao simular saque', 'error')
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleSavePix = async () => {
    if (!freelancerId || !pixKey) {
      showToast('A chave PIX não pode ser vazia', 'error')
      return
    }
    try {
      setIsSavingPix(true)
      const { error } = await supabase
        .from('freelancers')
        .update({ pix_key: pixKey, pix_key_type: pixKeyType })
        .eq('id', freelancerId)

      if (error) throw error
      showToast('Chave PIX atualizada!', 'success')
      setIsConfigOpen(false)
    } catch {
      showToast('Erro ao atualizar Chave PIX', 'error')
    } finally {
      setIsSavingPix(false)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const formatCurrencyRaw = (value: number) =>
    value.toFixed(2)

  const getStatusDisplay = (status: Transaction['status']) => {
    switch (status) {
      case 'pendente': return { label: 'Aguardando Pagamento', color: 'text-gray-500', icon: <Clock size={14} className="text-gray-400" /> }
      case 'retido':   return { label: 'A Liberar (pós-checkout)', color: 'text-amber-600', icon: <Clock size={14} className="text-amber-500" /> }
      case 'liberado': return { label: 'Disponível para Saque', color: 'text-green-600', icon: <CheckCircle size={14} className="text-green-500" /> }
      case 'sacado':   return { label: 'Sacado', color: 'text-blue-500', icon: <ArrowUpRight size={14} className="text-blue-500" /> }
      default:         return { label: status, color: 'text-gray-500', icon: <Clock size={14} /> }
    }
  }

  const PIX_OPTIONS = [
    { label: 'CPF', value: 'CPF' },
    { label: 'E-mail', value: 'EMAIL' },
    { label: 'Celular', value: 'PHONE' },
    { label: 'Chave Aleatória', value: 'EVP' },
    { label: 'CNPJ', value: 'CNPJ' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-6">
      <TopBar
        variant="inner"
        title="Minha Carteira"
        onBack={() => navigate(-1)}
        actions={
          <button
            onClick={() => setIsConfigOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="Configurar Chave PIX"
          >
            <Settings size={20} />
          </button>
        }
      />

      <main className="max-w-2xl mx-auto p-4 space-y-5">

        {/* ── Saldos ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {isLoading ? (
            <>
              <SkeletonStatCard />
              <SkeletonStatCard />
            </>
          ) : (
            <>
              <SaldoCard
                label="Disponível"
                value={formatCurrency(saldoDisponivel)}
                subtext="Pronto para saque"
                icon={
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Wallet size={18} className="text-green-600" />
                  </div>
                }
              />
              <SaldoCard
                label="A Liberar"
                value={formatCurrency(saldoRetido)}
                subtext="Pós checkout"
                tooltip="Este valor está retido até que o contratante confirme a conclusão do trabalho via checkout. Assim que o checkout for feito, o saldo é liberado automaticamente para saque."
                icon={
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Clock size={18} className="text-amber-600" />
                  </div>
                }
              />
            </>
          )}
        </div>

        {/* ── Card de Saque ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <ArrowDownToLine size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Sacar para Conta Bancária</h3>
            <p className="text-sm text-gray-500 mt-1">
              Transferência via PIX para sua conta em até <span className="font-medium text-gray-700">1 dia útil</span>.
            </p>
          </div>

          {!isLoading && !pixKey && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-left w-full">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-600">
                Configure sua chave PIX usando o ícone de engrenagem no topo antes de sacar.
              </p>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={saldoDisponivel <= 0 || isLoading}
            onClick={openWithdrawSheet}
          >
            {isLoading ? 'Carregando...' : saldoDisponivel > 0 ? `Sacar ${formatCurrency(saldoDisponivel)}` : 'Sem saldo disponível'}
          </Button>
        </div>

        {/* ── Histórico ────────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <History size={18} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">Histórico de Transações</h3>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <>
                <SkeletonTxRow />
                <SkeletonTxRow />
                <SkeletonTxRow />
              </>
            ) : transactions.length === 0 ? (
              <EmptyState
                icon={<Landmark size={44} className="text-gray-300" />}
                title="Nenhuma transação ainda"
                description="Suas transações financeiras aparecerão aqui."
              />
            ) : (
              transactions.map(tx => {
                const st = getStatusDisplay(tx.status)
                return (
                  <div
                    key={tx.id}
                    className="bg-white px-4 py-3.5 rounded-xl border border-gray-100 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {tx.jobs?.titulo || 'Trabalho Extra'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {st.icon}
                        <span className={`text-xs font-medium ${st.color}`}>{st.label}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-400">
                          {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <span className={`ml-4 font-semibold text-sm ${tx.status === 'sacado' ? 'text-gray-500' : 'text-green-600'}`}>
                      {formatCurrency(Number(tx.valor_liquido))}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </main>

      {/* ── BottomSheet: Saque ───────────────────────────────────────────── */}
      <BottomSheet open={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} title="Solicitar Saque">
        <div className="p-4 space-y-5">
          {/* Saldo disponível */}
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-green-800 font-medium">Saldo disponível</span>
            <span className="text-lg font-bold text-green-700">{formatCurrency(saldoDisponivel)}</span>
          </div>

          {/* Input de valor */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Valor do saque</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">R$</span>
              <input
                type="number"
                min="0.01"
                max={saldoDisponivel}
                step="0.01"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="0,00"
                className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 font-medium text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            {withdrawAmountNum > saldoDisponivel && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} /> Valor maior que o saldo disponível.
              </p>
            )}
          </div>

          {/* Botão rápido: Sacar Tudo */}
          <button
            onClick={() => setWithdrawAmount(formatCurrencyRaw(saldoDisponivel))}
            className="w-full text-sm text-green-700 font-semibold border border-green-300 bg-green-50 hover:bg-green-100 rounded-xl py-2.5 transition-colors"
          >
            Sacar Tudo ({formatCurrency(saldoDisponivel)})
          </button>

          {/* Chave PIX */}
          {pixKey && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500">PIX de destino</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{pixKey}</p>
              <p className="text-xs text-gray-400">{pixKeyType}</p>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!withdrawAmountValid}
            loading={isWithdrawing}
            onClick={handleWithdraw}
          >
            Confirmar Saque de {withdrawAmountNum > 0 ? formatCurrency(withdrawAmountNum) : '—'}
          </Button>

          {import.meta.env.VITE_VALIDAPAY_ENV === 'sandbox' && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full border-2 border-dashed border-amber-300 text-amber-700 hover:bg-amber-50"
              disabled={!withdrawAmountValid || isWithdrawing}
              onClick={handleSimulateWithdrawal}
            >
              🧪 Simular saque (sandbox)
            </Button>
          )}
        </div>
      </BottomSheet>

      {/* ── BottomSheet: Config PIX ──────────────────────────────────────── */}
      <BottomSheet open={isConfigOpen} onClose={() => setIsConfigOpen(false)} title="Configurar Chave PIX">
        <div className="p-4 space-y-5">
          <p className="text-sm text-gray-600">
            Esta chave será usada para todos os saques. Certifique-se de que a conta está em <strong>seu nome</strong> — a ValidaPay valida a titularidade.
          </p>

          <Select
            label="Tipo de Chave PIX"
            value={pixKeyType}
            onChange={setPixKeyType}
            options={PIX_OPTIONS}
            placeholder="Selecione o tipo..."
          />

          <Input
            label="Chave PIX"
            placeholder="Digite sua chave PIX..."
            value={pixKey}
            onChange={e => setPixKey(e.target.value)}
          />

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={isSavingPix}
            onClick={handleSavePix}
            disabled={!pixKey}
          >
            Salvar Chave PIX
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
