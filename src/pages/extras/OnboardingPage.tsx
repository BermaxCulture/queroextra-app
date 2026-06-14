import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  User,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Clock,
  CheckCircle2,
  X,
  ChevronUp,
  AlertCircle,
} from 'lucide-react'
import { Input, Button, Select, useToast, Modal } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

// ─── Schemas ────────────────────────────────────────────────────────────────

const addressSchema = z.object({
  cep: z.string().min(9, 'CEP inválido').max(9),
  rua: z.string().min(2, 'Informe a rua'),
  numero: z.string().min(1, 'Informe o número'),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Informe o bairro'),
  cidade: z.string().min(2, 'Informe a cidade'),
  estado: z.string().length(2, 'Estado inválido (ex: SP)'),
})

const financialSchema = z.object({
  data_nascimento: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, 'Data inválida. Use o formato DD-MM-AAAA'),
  nome_mae: z.string().min(3, 'Nome da mãe obrigatório'),
  faixa_renda: z.string().min(1, 'Selecione sua faixa de renda'),
  ocupacao: z.string().min(1, 'Selecione sua ocupação'),
  faixa_patrimonio: z.string().min(1, 'Selecione sua faixa patrimonial'),
  pessoa_politicamente_exposta: z.boolean().optional(),
})

type AddressData = z.infer<typeof addressSchema>
type FinancialData = z.infer<typeof financialSchema>

// ─── Select options ──────────────────────────────────────────────────────────

const RENDA_OPTIONS = [
  { value: 'DINP01', label: 'Até R$ 1.500/mês' },
  { value: 'DINP02', label: 'R$ 1.500 a R$ 3.000/mês' },
  { value: 'DINP03', label: 'R$ 3.000 a R$ 5.000/mês' },
  { value: 'DINP04', label: 'R$ 5.000 a R$ 10.000/mês' },
  { value: 'DINP05', label: 'Acima de R$ 10.000/mês' },
]

const OCUPACAO_OPTIONS = [
  { value: 'ONP01', label: 'Assalariado(a) CLT' },
  { value: 'ONP02', label: 'Autônomo(a)' },
  { value: 'ONP03', label: 'Profissional Liberal' },
  { value: 'ONP04', label: 'Empresário(a)' },
  { value: 'ONP05', label: 'Servidor(a) Público(a)' },
  { value: 'ONP06', label: 'Aposentado(a) / Pensionista' },
  { value: 'ONP07', label: 'Trabalhador(a) Rural' },
  { value: 'ONP08', label: 'Microempreendedor(a) Individual (MEI)' },
  { value: 'ONP09', label: 'Estudante' },
  { value: 'ONP10', label: 'Outros' },
]

const PATRIMONIO_OPTIONS = [
  { value: 'NWNP01', label: 'Até R$ 5.000' },
  { value: 'NWNP02', label: 'R$ 5.000 a R$ 20.000' },
  { value: 'NWNP03', label: 'R$ 20.000 a R$ 100.000' },
  { value: 'NWNP04', label: 'R$ 100.000 a R$ 300.000' },
  { value: 'NWNP05', label: 'Acima de R$ 300.000' },
]

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
].map((uf) => ({ value: uf, label: uf }))

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={[
            'h-1.5 rounded-full transition-all duration-300',
            i + 1 === current
              ? 'w-8 bg-qe-yellow'
              : i + 1 < current
              ? 'w-4 bg-qe-yellow/40'
              : 'w-4 bg-qe-gray-200',
          ].join(' ')}
        />
      ))}
    </div>
  )
}

// ─── Step 1: Endereço ────────────────────────────────────────────────────────

function StepEndereco({ onNext }: { onNext: (data: AddressData) => void }) {
  const [loadingCep, setLoadingCep] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressData>({ resolver: zodResolver(addressSchema) })

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '')
    if (cep.length !== 8) return
    setLoadingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setValue('rua', data.logradouro ?? '', { shouldValidate: true })
        setValue('bairro', data.bairro ?? '', { shouldValidate: true })
        setValue('cidade', data.localidade ?? '', { shouldValidate: true })
        setValue('estado', data.uf ?? '', { shouldValidate: true })
      }
    } catch {
      // usuário preenche manualmente
    } finally {
      setLoadingCep(false)
    }
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
    const formatted = raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw
    setValue('cep', formatted, { shouldValidate: raw.length === 8 })
  }

  const estadoValue = watch('estado') ?? ''

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div className="text-center mb-1">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-qe-yellow-subtle mb-3">
          <MapPin size={22} className="text-qe-yellow-text" />
        </div>
        <h2 className="text-[18px] font-bold text-qe-gray-900">Seu endereço</h2>
        <p className="text-[12px] text-qe-gray-400 mt-1">
          Necessário para criar sua conta de repasse
        </p>
      </div>

      <Input
        label="CEP"
        placeholder="00000-000"
        inputMode="numeric"
        {...register('cep')}
        onChange={handleCepChange}
        onBlur={handleCepBlur}
        errorMessage={errors.cep?.message}
        helperText={loadingCep ? 'Buscando endereço...' : undefined}
      />
      <Input
        label="Rua / Logradouro"
        placeholder="Ex: Rua das Flores"
        {...register('rua')}
        errorMessage={errors.rua?.message}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Número"
          placeholder="123"
          inputMode="numeric"
          {...register('numero')}
          errorMessage={errors.numero?.message}
        />
        <Input
          label="Complemento"
          placeholder="Apto 4 (opcional)"
          {...register('complemento')}
        />
      </div>
      <Input
        label="Bairro"
        placeholder="Ex: Centro"
        {...register('bairro')}
        errorMessage={errors.bairro?.message}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Cidade"
          placeholder="Ex: São Paulo"
          {...register('cidade')}
          errorMessage={errors.cidade?.message}
        />
        <Select
          label="Estado"
          placeholder="UF"
          options={ESTADOS_BR}
          value={estadoValue}
          onChange={(val) => setValue('estado', val, { shouldValidate: true })}
          errorMessage={errors.estado?.message}
        />
      </div>

      <Button type="submit" size="lg" trailingIcon={<ArrowRight size={20} />}>
        Próximo
      </Button>
    </form>
  )
}

// ─── Step 2: Dados Pessoais + Financeiros ────────────────────────────────────

function StepFinanceiro({
  onNext,
  onBack,
  loading,
}: {
  onNext: (data: FinancialData) => void
  onBack: () => void
  loading: boolean
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FinancialData>({
    resolver: zodResolver(financialSchema),
    defaultValues: { pessoa_politicamente_exposta: false },
  })

  const faixaRenda = watch('faixa_renda') ?? ''
  const ocupacao = watch('ocupacao') ?? ''
  const faixaPatrimonio = watch('faixa_patrimonio') ?? ''
  const ppe = watch('pessoa_politicamente_exposta') ?? false

  const handleNascimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
    let formatted = raw
    if (raw.length > 4) formatted = `${raw.slice(0, 2)}-${raw.slice(2, 4)}-${raw.slice(4)}`
    else if (raw.length > 2) formatted = `${raw.slice(0, 2)}-${raw.slice(2)}`
    setValue('data_nascimento', formatted, { shouldValidate: raw.length === 8 })
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div className="text-center mb-1">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-qe-yellow-subtle mb-3">
          <User size={22} className="text-qe-yellow-text" />
        </div>
        <h2 className="text-[18px] font-bold text-qe-gray-900">Dados pessoais</h2>
        <p className="text-[12px] text-qe-gray-400 mt-1">
          Exigidos pela regulamentação financeira
        </p>
      </div>

      <Input
        label="Data de Nascimento"
        placeholder="DD-MM-AAAA"
        inputMode="numeric"
        {...register('data_nascimento')}
        onChange={handleNascimentoChange}
        errorMessage={errors.data_nascimento?.message}
      />
      <Input
        label="Nome da Mãe"
        placeholder="Ex: Maria da Silva"
        {...register('nome_mae')}
        errorMessage={errors.nome_mae?.message}
      />
      <Select
        label="Faixa de Renda Mensal"
        placeholder="Selecione..."
        options={RENDA_OPTIONS}
        value={faixaRenda}
        onChange={(val) => setValue('faixa_renda', val, { shouldValidate: true })}
        errorMessage={errors.faixa_renda?.message}
      />
      <Select
        label="Ocupação"
        placeholder="Selecione..."
        options={OCUPACAO_OPTIONS}
        value={ocupacao}
        onChange={(val) => setValue('ocupacao', val, { shouldValidate: true })}
        errorMessage={errors.ocupacao?.message}
      />
      <Select
        label="Faixa Patrimonial"
        placeholder="Selecione..."
        options={PATRIMONIO_OPTIONS}
        value={faixaPatrimonio}
        onChange={(val) => setValue('faixa_patrimonio', val, { shouldValidate: true })}
        errorMessage={errors.faixa_patrimonio?.message}
      />

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={ppe}
          onChange={(e) => setValue('pessoa_politicamente_exposta', e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-qe-gray-300 accent-qe-yellow"
        />
        <span className="text-[13px] text-qe-gray-600 leading-snug">
          Sou Pessoa Politicamente Exposta (PEP)
        </span>
      </label>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          leadingIcon={<ArrowLeft size={20} />}
          onClick={onBack}
          className="flex-1"
        >
          Voltar
        </Button>
        <Button
          type="submit"
          size="lg"
          loading={loading}
          trailingIcon={!loading ? <ArrowRight size={20} /> : undefined}
          className="flex-[2]"
        >
          Enviar
        </Button>
      </div>
    </form>
  )
}

// ─── Step 3: KYC ─────────────────────────────────────────────────────────────

function StepKyc({
  urlDocumentscopy,
  onClose,
}: {
  urlDocumentscopy: string | null
  onClose: () => void
}) {
  return (
    <div className="text-center space-y-5">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-qe-yellow-subtle">
        <CheckCircle2 size={30} className="text-qe-yellow-text" />
      </div>
      <div>
        <h2 className="text-[18px] font-bold text-qe-gray-900">Quase lá!</h2>
        <p className="text-[13px] text-qe-gray-500 mt-2 leading-relaxed">
          Seus dados foram enviados. Agora envie uma foto dos seus documentos para validação de identidade.
        </p>
      </div>
      <div className="bg-qe-gray-50 border border-qe-gray-200 rounded-qe-md p-4 text-left flex items-start gap-2">
        <Clock size={15} className="text-qe-gray-400 shrink-0 mt-0.5" />
        <p className="text-[12px] text-qe-gray-500 leading-relaxed">
          Após o envio, a aprovação pode levar até 24h. Você terá acesso completo assim que sua conta for aprovada.
        </p>
      </div>

      {urlDocumentscopy ? (
        <a
          href={urlDocumentscopy}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-[52px] bg-qe-yellow text-qe-black font-semibold text-[16px] rounded-qe-pill hover:bg-qe-yellow-hover transition-colors"
        >
          <ExternalLink size={18} />
          Enviar documentos
        </a>
      ) : (
        <p className="text-[12px] text-qe-gray-400 bg-qe-gray-50 rounded-qe-md p-3">
          Link de documentos não disponível. Entre em contato com o suporte.
        </p>
      )}

      <button
        onClick={onClose}
        className="text-[13px] text-qe-gray-400 hover:text-qe-gray-600 transition-colors"
      >
        Fazer isso depois
      </button>
    </div>
  )
}

// ─── Mini badge flutuante ────────────────────────────────────────────────────

function OnboardingMiniBadge({ onExpand }: { onExpand: () => void }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="fixed bottom-20 right-4 z-[9997] lg:bottom-6"
      >
        <div className="bg-qe-white rounded-qe-lg shadow-qe-lg border border-qe-gray-200 w-[260px] overflow-hidden">
          {/* Header do mini badge */}
          <div className="flex items-center justify-between px-4 py-3 bg-qe-yellow">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-qe-black" />
              <span className="text-[13px] font-bold text-qe-black">Complete seu cadastro</span>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-qe-black/50 hover:text-qe-black transition-colors"
              aria-label="Fechar"
            >
              <X size={15} />
            </button>
          </div>
          {/* Body */}
          <div className="px-4 py-3 space-y-3">
            <p className="text-[12px] text-qe-gray-500 leading-snug">
              Configure sua conta de repasse para receber por vagas.
            </p>
            <button
              onClick={onExpand}
              className="flex items-center justify-between w-full text-[13px] font-semibold text-qe-black hover:text-qe-yellow-text transition-colors"
            >
              <span>Continuar configuração</span>
              <ChevronUp size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Componente principal exportável ─────────────────────────────────────────

export default function OnboardingModal() {
  const { freelancer, refreshFreelancer } = useAuth()
  const [open, setOpen] = useState(
    freelancer?.validapay_onboarding_status === null
  )
  const [step, setStep] = useState(1)
  const [addressData, setAddressData] = useState<AddressData | null>(null)
  const [urlDocumentscopy, setUrlDocumentscopy] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  // Não renderiza nada se o onboarding já foi concluído ou está em análise
  if (
    !freelancer ||
    freelancer.validapay_onboarding_status === 'aprovado' ||
    freelancer.validapay_onboarding_status === 'em_analise'
  ) {
    return null
  }

  const handleClose = () => setOpen(false)
  const handleExpand = () => {
    setOpen(true)
  }

  const handleAddressNext = (data: AddressData) => {
    setAddressData(data)
    setStep(2)
  }

  const handleFinancialNext = async (data: FinancialData) => {
    if (!addressData) return
    setSubmitting(true)
    try {
      const { data: result, error } = await supabase.functions.invoke('create-subaccount', {
        body: { ...addressData, ...data },
      })

      if (error) throw error
      if (!result?.ok) throw new Error(result?.error ?? 'Erro ao criar subconta')

      setUrlDocumentscopy(result.urlDocumentscopy ?? null)
      await refreshFreelancer()
      setStep(3)
    } catch (err: any) {
      const msg = err?.message ?? 'Erro desconhecido'
      showToast(`Não foi possível criar sua conta: ${msg}`, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Modal open={open} onClose={handleClose} title="Configurar conta de repasse">
        <StepIndicator current={step} total={3} />

        {step === 1 && <StepEndereco onNext={handleAddressNext} />}
        {step === 2 && (
          <StepFinanceiro
            onNext={handleFinancialNext}
            onBack={() => setStep(1)}
            loading={submitting}
          />
        )}
        {step === 3 && (
          <StepKyc urlDocumentscopy={urlDocumentscopy} onClose={handleClose} />
        )}
      </Modal>

      {/* Mini badge quando modal está fechado */}
      {!open && <OnboardingMiniBadge onExpand={handleExpand} />}
    </>
  )
}
