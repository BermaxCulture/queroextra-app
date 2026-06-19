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
  ChevronDown,
  AlertCircle,
  Copy,
  Check,
  FileText,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
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
  pix_key_type: z.enum(['cpf', 'telefone', 'email', 'chave_aleatoria'], {
    required_error: 'Selecione o tipo de chave PIX',
  }),
  pix_key: z.string().min(1, 'Informe sua chave PIX'),
}).superRefine((data, ctx) => {
  const { pix_key_type, pix_key } = data
  if (pix_key_type === 'cpf' && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/.test(pix_key)) {
    ctx.addIssue({ code: 'custom', path: ['pix_key'], message: 'CPF inválido' })
  }
  if (pix_key_type === 'telefone' && !/^\(\d{2}\) \d{4,5}-\d{4}$/.test(pix_key)) {
    ctx.addIssue({ code: 'custom', path: ['pix_key'], message: 'Telefone inválido. Ex: (11) 99999-9999' })
  }
  if (pix_key_type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pix_key)) {
    ctx.addIssue({ code: 'custom', path: ['pix_key'], message: 'E-mail inválido' })
  }
  if (
    pix_key_type === 'chave_aleatoria' &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pix_key)
  ) {
    ctx.addIssue({ code: 'custom', path: ['pix_key'], message: 'Chave aleatória inválida (formato UUID)' })
  }
})

type AddressData = z.infer<typeof addressSchema>
type FinancialData = z.infer<typeof financialSchema>

// ─── Select options ──────────────────────────────────────────────────────────

const RENDA_OPTIONS = [
  { value: 'DINP01', label: 'Até R$ 5.000' },
  { value: 'DINP02', label: 'R$ 5.001 a R$ 10.000' },
  { value: 'DINP03', label: 'R$ 10.001 a R$ 30.000' },
  { value: 'DINP04', label: 'R$ 30.001 a R$ 100.000' },
  { value: 'DINP05', label: 'Acima de R$ 100.000' },
]

const OCUPACAO_OPTIONS = [
  { value: 'ONP01', label: 'Administrador / Gerente' },
  { value: 'ONP02', label: 'Vendedor / Representante Comercial' },
  { value: 'ONP03', label: 'Analista de RH / Assistente de Pessoal' },
  { value: 'ONP04', label: 'Analista Financeiro / Contador' },
  { value: 'ONP05', label: 'Desenvolvedor / Analista de Sistemas' },
  { value: 'ONP06', label: 'Profissional de Marketing / Publicitário' },
  { value: 'ONP07', label: 'Médico / Dentista / Enfermeiro' },
  { value: 'ONP08', label: 'Professor / Educador' },
  { value: 'ONP09', label: 'Engenheiro (em qualquer área)' },
  { value: 'ONP10', label: 'Advogado / Jurista' },
  { value: 'ONP11', label: 'Auxiliar de Serviços Gerais / Faxineiro' },
  { value: 'ONP12', label: 'Pedreiro / Servente / Mestre de Obras' },
  { value: 'ONP13', label: 'Motorista / Entregador / Logístico' },
  { value: 'ONP14', label: 'Recepcionista / Operador de Caixa' },
  { value: 'ONP15', label: 'Técnico (Eletricidade, Mecânica, etc.)' },
  { value: 'ONP16', label: 'Designer Gráfico / Artista' },
  { value: 'ONP17', label: 'Operador de Máquinas / Montador' },
  { value: 'ONP18', label: 'Consultor / Autônomo' },
  { value: 'ONP19', label: 'Cabeleireiro / Manicure / Esteticista' },
  { value: 'ONP20', label: 'Vigilante / Agente de Segurança' },
  { value: 'ONP21', label: 'Trabalhador Agropecuário / Agrônomo' },
  { value: 'ONP22', label: 'Agente de Viagens / Hoteleiro' },
  { value: 'ONP23', label: 'Jornalista / Relações Públicas' },
  { value: 'ONP24', label: 'Psicólogo / Terapeuta' },
  { value: 'ONP25', label: 'Servidor Público' },
  { value: 'ONP26', label: 'Pesquisador / Cientista' },
  { value: 'ONP27', label: 'Artesão / MEI' },
  { value: 'ONP28', label: 'Aposentado / Reformado' },
  { value: 'ONP29', label: 'Estudante (Sem Renda Própria)' },
  { value: 'ONP30', label: 'Autônomo' },
  { value: 'ONP31', label: 'Outros' },
]

const PATRIMONIO_OPTIONS = [
  { value: 'NWNP01', label: 'Até R$ 50.000' },
  { value: 'NWNP02', label: 'R$ 50.001 a R$ 200.000' },
  { value: 'NWNP03', label: 'R$ 200.001 a R$ 1.000.000' },
  { value: 'NWNP04', label: 'R$ 1.000.001 a R$ 5.000.000' },
  { value: 'NWNP05', label: 'Acima de R$ 5.000.000' },
]

const PIX_KEY_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'email', label: 'E-mail' },
  { value: 'chave_aleatoria', label: 'Chave aleatória' },
]

const PIX_PLACEHOLDERS: Record<string, string> = {
  cpf: '000.000.000-00',
  telefone: '(11) 99999-9999',
  email: 'seuemail@email.com',
  chave_aleatoria: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
}

function applyPhoneMask(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

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

// ─── Step 2: Dados financeiros + Chave PIX ───────────────────────────────────

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
    defaultValues: { pessoa_politicamente_exposta: false, pix_key_type: 'cpf' },
  })

  const faixaRenda = watch('faixa_renda') ?? ''
  const ocupacao = watch('ocupacao') ?? ''
  const faixaPatrimonio = watch('faixa_patrimonio') ?? ''
  const ppe = watch('pessoa_politicamente_exposta') ?? false
  const pixKeyType = watch('pix_key_type') ?? 'cpf'

  const handleNascimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
    let formatted = raw
    if (raw.length > 4) formatted = `${raw.slice(0, 2)}-${raw.slice(2, 4)}-${raw.slice(4)}`
    else if (raw.length > 2) formatted = `${raw.slice(0, 2)}-${raw.slice(2)}`
    setValue('data_nascimento', formatted, { shouldValidate: raw.length === 8 })
  }

  const handlePixTypeChange = (val: string) => {
    setValue('pix_key_type', val as FinancialData['pix_key_type'], { shouldValidate: false })
    setValue('pix_key', '', { shouldValidate: false })
  }

  const handlePixKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = pixKeyType === 'telefone'
      ? applyPhoneMask(e.target.value)
      : e.target.value
    setValue('pix_key', val, { shouldValidate: false })
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div className="text-center mb-1">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-qe-yellow-subtle mb-3">
          <User size={22} className="text-qe-yellow-text" />
        </div>
        <h2 className="text-[18px] font-bold text-qe-gray-900">Dados e chave PIX</h2>
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

      {/* Separador visual */}
      <div className="border-t border-qe-gray-100 pt-3">
        <p className="text-[12px] font-semibold text-qe-gray-500 mb-3 uppercase tracking-wide">
          Chave PIX para recebimento
        </p>
        <Select
          label="Tipo de chave PIX"
          options={PIX_KEY_TYPES}
          value={pixKeyType}
          onChange={handlePixTypeChange}
        />
        <div className="mt-3">
          <Input
            label="Chave PIX"
            placeholder={PIX_PLACEHOLDERS[pixKeyType] ?? ''}
            inputMode={pixKeyType === 'telefone' ? 'numeric' : undefined}
            {...register('pix_key')}
            onChange={handlePixKeyChange}
            errorMessage={errors.pix_key?.message}
          />
        </div>
        <p className="text-[11px] text-qe-gray-400 mt-2 leading-snug">
          Você receberá seus pagamentos nesta chave após cada serviço concluído.
        </p>
      </div>

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
          Após o envio, a aprovação pode levar até 24h. Você poderá se candidatar a vagas assim que sua conta for aprovada.
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
        <p className="text-[12px] text-qe-gray-500 bg-qe-yellow-subtle/50 border border-qe-yellow/20 rounded-qe-md p-3">
          Estamos processando seu cadastro. O link para envio dos documentos será gerado em instantes.<br/><br/>
          Você pode fechar esta tela. Assim que o link estiver pronto, um card de Validação Pendente aparecerá no canto da tela!
        </p>
      )}

      <button
        onClick={onClose}
        className="text-[13px] font-medium text-qe-gray-400 hover:text-qe-gray-600 transition-colors"
      >
        Fechar e aguardar
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

// ─── KYC Pending Badge ───────────────────────────────────────────────────────

function KycPendingBadge({ url }: { url: string }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="fixed bottom-20 right-4 z-[9997] lg:bottom-6 w-[280px]"
      >
        <div className="bg-qe-white rounded-qe-lg shadow-qe-lg border border-qe-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-200">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-2 flex-1 text-left"
            >
              <FileText size={15} className="text-amber-600 shrink-0" />
              <span className="text-[13px] font-bold text-amber-800">Envie seus documentos</span>
              {expanded
                ? <ChevronDown size={14} className="text-amber-600 ml-auto" />
                : <ChevronUp size={14} className="text-amber-600 ml-auto" />
              }
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-amber-400 hover:text-amber-700 transition-colors ml-2"
              aria-label="Fechar"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body colapsável */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-4 space-y-4">
                  <p className="text-[12px] text-qe-gray-500 leading-snug">
                    Escaneie o QR Code ou copie o link para enviar seus documentos e validar sua conta.
                  </p>

                  {/* QR Code */}
                  <div className="flex justify-center">
                    <div className="bg-white p-2 rounded-qe-md border border-qe-gray-200 inline-block">
                      <QRCodeSVG value={url} size={140} />
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-qe-yellow text-qe-black text-[13px] font-semibold rounded-qe-pill hover:bg-qe-yellow-hover transition-colors"
                    >
                      <ExternalLink size={13} />
                      Abrir link
                    </a>
                    <button
                      onClick={handleCopy}
                      className="flex items-center justify-center gap-1.5 h-9 px-3 border border-qe-gray-200 text-qe-gray-600 text-[13px] rounded-qe-pill hover:bg-qe-gray-50 transition-colors"
                    >
                      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>

                  <p className="text-[11px] text-qe-gray-400 text-center leading-snug">
                    Aprovação em até 24h após o envio dos documentos.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview collapsed */}
          {!expanded && (
            <div className="px-4 py-3">
              <p className="text-[12px] text-qe-gray-500 leading-snug">
                Falta só enviar os documentos para ativar sua conta.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Componente principal exportável ─────────────────────────────────────────

export default function OnboardingModal() {
  const { freelancer, refreshFreelancer } = useAuth()
  const [open, setOpen] = useState(freelancer?.validapay_onboarding_status === null)
  const [step, setStep] = useState(1)
  const [addressData, setAddressData] = useState<AddressData | null>(null)
  const [urlDocumentscopy, setUrlDocumentscopy] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  // Não renderiza nada se o onboarding já foi aprovado
  if (!freelancer || freelancer.validapay_onboarding_status === 'aprovado') {
    return null
  }

  if (freelancer.validapay_onboarding_status === 'em_analise') {
    return freelancer.validapay_url_documentscopy
      ? <KycPendingBadge url={freelancer.validapay_url_documentscopy} />
      : null
  }

  const handleClose = () => setOpen(false)
  const handleExpand = () => setOpen(true)

  const handleAddressNext = (data: AddressData) => {
    setAddressData(data)
    setStep(2)
  }

  const handleFinancialNext = async (data: FinancialData) => {
    if (!addressData) return
    setSubmitting(true)
    try {
      // Normaliza telefone para formato E.164 (+55XXXXXXXXXXX) antes de enviar
      const pixKey = data.pix_key_type === 'telefone'
        ? `+55${data.pix_key.replace(/\D/g, '')}`
        : data.pix_key

      const { data: result, error } = await supabase.functions.invoke('create-subaccount', {
        body: { ...addressData, ...data, pix_key: pixKey },
      })

      if (error) throw error
      if (!result?.ok) throw new Error(result?.error ?? 'Erro ao criar subconta')

      setUrlDocumentscopy(result.urlDocumentscopy ?? null)
      await refreshFreelancer()
      setStep(3)
    } catch (err: any) {
      showToast(`Não foi possível criar sua conta: ${err?.message ?? 'Erro desconhecido'}`, 'error')
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

      {!open && <OnboardingMiniBadge onExpand={handleExpand} />}
    </>
  )
}
