import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Button,
  Input,
  Select,
  useToast,
  ResponsiveSheet,
} from '@/components/ui'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  Gift,
  AlertTriangle,
  Zap,
} from 'lucide-react'
import { JOB_CATEGORIES, JOB_TAGS, BRAZIL_STATES } from './jobConstants'

const VALOR_MINIMO_PADRAO = 50
const VALOR_MINIMO_TESTE = 1

function buildJobSchema(valorMinimo: number) {
  return z.object({
    titulo: z
      .string()
      .min(5, 'O título deve ter pelo menos 5 caracteres')
      .max(80, 'O título deve ter no máximo 80 caracteres'),
    categoria: z.string().min(1, 'Selecione uma categoria'),
    estado: z.string().min(2, 'Selecione o estado'),
    cidade: z.string().min(2, 'Informe a cidade'),
    local: z.string().min(5, 'Informe o endereço completo do local'),
    valor: z.coerce.number().min(valorMinimo, `O valor mínimo do turno é R$ ${valorMinimo.toFixed(2).replace('.', ',')}`),
    data_inicio: z.string().min(1, 'Informe a data e hora de início'),
    data_fim: z.string().min(1, 'Informe a data e hora de término'),
    descricao: z
      .string()
      .min(10, 'Descreva detalhadamente a vaga (mínimo 10 caracteres)'),
    beneficios: z.string().optional(),
    urgente: z.boolean().default(false),
  })
}

type JobFormData = z.infer<ReturnType<typeof buildJobSchema>>

function NovaVagaSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6" aria-busy="true" aria-label="Carregando formulário...">
      <div className="h-4 w-36 shimmer rounded" />
      <div className="space-y-2">
        <div className="h-7 w-64 shimmer rounded" />
        <div className="h-4 w-80 shimmer rounded" />
      </div>
      <div className="bg-white rounded-qe-md border border-qe-gray-200 p-6 md:p-8 space-y-6 shadow-qe-sm">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3.5 w-40 shimmer rounded" />
            <div className="h-[50px] shimmer rounded-qe-sm" />
          </div>
        ))}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="h-3.5 w-40 shimmer rounded" />
            <div className="h-[50px] shimmer rounded-qe-sm" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3.5 w-40 shimmer rounded" />
            <div className="h-[50px] shimmer rounded-qe-sm" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 w-48 shimmer rounded" />
          <div className="h-[120px] shimmer rounded-qe-sm" />
        </div>
        <div className="pt-4 border-t border-qe-gray-100 flex justify-end">
          <div className="h-[50px] w-44 shimmer rounded-qe-sm" />
        </div>
      </div>
    </div>
  )
}

export default function NovaVaga() {
  const { company } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [checkingLimit, setCheckingLimit] = React.useState(true)
  const [limitModalOpen, setLimitModalOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])

  // Empresas marcadas como conta de teste (companies.is_test_account) podem
  // publicar vagas de valor baixo real para testar o pagamento — mesma regra
  // aplicada no banco via trigger, sem afetar o mínimo de R$50 para as demais.
  const valorMinimo = company?.is_test_account ? VALOR_MINIMO_TESTE : VALOR_MINIMO_PADRAO
  const jobSchema = React.useMemo(() => buildJobSchema(valorMinimo), [valorMinimo])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema) as any,
    defaultValues: {
      titulo: '',
      categoria: '',
      estado: '',
      cidade: '',
      local: '',
      valor: 50,
      data_inicio: '',
      data_fim: '',
      descricao: '',
      beneficios: '',
      urgente: searchParams.get('urgent') === 'true',
    },
  })

  const watchUrgent = watch('urgente')

  const checkJobLimit = React.useCallback(async () => {
    if (!company?.id) return
    try {
      setCheckingLimit(true)
      const { count, error } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .in('status', ['aberta', 'em_andamento'])

      if (error) throw error

      if (count && count >= 3) {
        setLimitModalOpen(true)
      }
    } catch (err: any) {
      console.error('[NovaVaga] Erro ao verificar limite:', err)
      showToast('Erro ao validar limite de vagas.', 'error')
    } finally {
      setCheckingLimit(false)
    }
  }, [company?.id, showToast])

  React.useEffect(() => {
    checkJobLimit()
  }, [checkJobLimit])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const onSubmit = async (data: JobFormData) => {
    if (!company?.id) {
      showToast('Erro de autenticação.', 'error')
      return
    }

    if (new Date(data.data_fim) <= new Date(data.data_inicio)) {
      showToast('A data/hora de término deve ser posterior à de início', 'error')
      return
    }

    try {
      setIsSubmitting(true)

      const { count } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .in('status', ['aberta', 'em_andamento'])

      if (count && count >= 3) {
        setLimitModalOpen(true)
        showToast('Limite de vagas ativas excedido!', 'error')
        return
      }

      const { error } = await supabase.from('jobs').insert({
        company_id: company.id,
        titulo: data.titulo,
        categoria: data.categoria,
        estado: data.estado,
        cidade: data.cidade,
        local: data.local,
        valor: data.valor,
        data_inicio: new Date(data.data_inicio).toISOString(),
        data_fim: new Date(data.data_fim).toISOString(),
        descricao: data.descricao,
        beneficios: data.beneficios || null,
        urgente: data.urgente,
        status: 'aberta',
        tags: selectedTags,
      })

      if (error) throw error

      showToast('Vaga publicada com sucesso! ⚡', 'success')
      navigate('/empresa/gestao')
    } catch (err: any) {
      console.error('[NovaVaga] Erro ao cadastrar vaga:', err)
      showToast('Não foi possível publicar a vaga. Verifique os dados.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (checkingLimit) return <NovaVagaSkeleton />

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Botão voltar */}
      <button
        type="button"
        onClick={() => navigate('/empresa/gestao')}
        className="flex items-center gap-2 text-[14px] text-qe-gray-500 font-bold hover:text-qe-gray-700 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Voltar para Gestão
      </button>

      {/* Título */}
      <div>
        <h1 className="text-h1 font-bold text-qe-gray-900">Publicar Nova Vaga</h1>
        <p className="text-[14px] text-qe-gray-500 mt-1">
          Preencha as informações para recrutar profissionais extras qualificados.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-qe-md border border-qe-gray-200 p-6 md:p-8 space-y-6 shadow-qe-sm">
        {/* Titulo */}
        <Input
          label="Título da Vaga"
          placeholder="Ex: Garçom para Evento de Casamento"
          errorMessage={errors.titulo?.message}
          {...register('titulo')}
        />

        {/* Categoria */}
        <Controller
          name="categoria"
          control={control}
          render={({ field }) => (
            <Select
              label="Categoria Profissional"
              placeholder="Selecione a categoria..."
              options={JOB_CATEGORIES.map((c) => ({ label: c, value: c }))}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              errorMessage={errors.categoria?.message}
            />
          )}
        />

        {/* Estado e Cidade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="estado"
            control={control}
            render={({ field }) => (
              <Select
                label="Estado"
                placeholder="Selecione o estado..."
                options={BRAZIL_STATES}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                errorMessage={errors.estado?.message}
              />
            )}
          />
          <Input
            label="Cidade"
            placeholder="Ex: São Paulo"
            icon={<MapPin size={18} />}
            errorMessage={errors.cidade?.message}
            {...register('cidade')}
          />
        </div>

        {/* Endereço */}
        <Input
          label="Endereço Completo do Local"
          placeholder="Rua, número, bairro — Cidade/UF"
          icon={<MapPin size={18} />}
          errorMessage={errors.local?.message}
          {...register('local')}
        />

        {/* Valor do Turno */}
        <Input
          label="Valor do Turno (R$)"
          type="number"
          placeholder="Ex: 150"
          icon={<DollarSign size={18} />}
          helperText={
            company?.is_test_account
              ? `Conta de teste — mínimo de R$ ${VALOR_MINIMO_TESTE.toFixed(2).replace('.', ',')} para validar pagamentos sem gastar o valor cheio.`
              : `Valor pago direto ao profissional ao final do expediente. Mínimo de R$ ${VALOR_MINIMO_PADRAO.toFixed(2).replace('.', ',')}.`
          }
          errorMessage={errors.valor?.message}
          {...register('valor')}
        />

        {/* Datas e Horários */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Data/Hora de Início"
            type="datetime-local"
            icon={<Calendar size={18} />}
            errorMessage={errors.data_inicio?.message}
            {...register('data_inicio')}
          />
          <Input
            label="Data/Hora de Término"
            type="datetime-local"
            icon={<Calendar size={18} />}
            errorMessage={errors.data_fim?.message}
            {...register('data_fim')}
          />
        </div>

        {/* Descrição */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-[13px] font-semibold text-qe-gray-700">
            Descrição do Turno e Requisitos
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-qe-gray-400 pointer-events-none flex items-start" aria-hidden="true">
              <FileText size={18} />
            </span>
            <textarea
              placeholder="Descreva as principais funções, roupas necessárias, perfil esperado..."
              className={[
                'w-full min-h-[120px] bg-qe-white border-[1.5px] rounded-qe-sm font-sans text-[16px] text-qe-gray-900',
                'placeholder:text-qe-gray-400 transition-all outline-none py-3 pl-11 pr-3.5',
                errors.descricao
                  ? 'border-qe-error focus:border-qe-error focus:shadow-[0_0_0_3px_rgba(217,48,37,0.10)]'
                  : 'border-qe-gray-200 focus:border-qe-yellow focus:shadow-[0_0_0_3px_rgba(245,192,0,0.15)]',
              ].join(' ')}
              {...register('descricao')}
            />
          </div>
          {errors.descricao && (
            <span className="text-[12px] text-qe-error" role="alert">
              {errors.descricao.message}
            </span>
          )}
        </div>

        {/* Benefícios (opcional) */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-[13px] font-semibold text-qe-gray-700">
            Benefícios <span className="font-normal text-qe-gray-400">(opcional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-qe-gray-400 pointer-events-none flex items-start" aria-hidden="true">
              <Gift size={18} />
            </span>
            <textarea
              placeholder="Ex: Vale transporte, refeição incluída, gorjeta garantida..."
              className="w-full min-h-[80px] bg-qe-white border-[1.5px] rounded-qe-sm font-sans text-[16px] text-qe-gray-900 placeholder:text-qe-gray-400 transition-all outline-none py-3 pl-11 pr-3.5 border-qe-gray-200 focus:border-qe-yellow focus:shadow-[0_0_0_3px_rgba(245,192,0,0.15)]"
              {...register('beneficios')}
            />
          </div>
        </div>

        {/* Tags Opcionais */}
        <div className="space-y-2 border-t border-qe-gray-100 pt-4">
          <label className="text-[13px] font-semibold text-qe-gray-700">
            Tags <span className="font-normal text-qe-gray-400">(opcional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {JOB_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={[
                    'px-3.5 py-2 rounded-qe-pill text-[13px] font-medium transition-all cursor-pointer border',
                    isSelected
                      ? 'bg-qe-yellow-subtle text-qe-yellow-text border-qe-yellow font-bold'
                      : 'bg-qe-white text-qe-gray-500 border-qe-gray-200 hover:border-qe-gray-300',
                  ].join(' ')}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* Destacar como Urgente */}
        <div
          className={[
            'flex items-start gap-3.5 p-4 rounded-qe-md border transition-all cursor-pointer',
            watchUrgent
              ? 'bg-qe-error-bg border-qe-error'
              : 'bg-qe-gray-50 border-qe-gray-200 hover:border-qe-gray-300',
          ].join(' ')}
          onClick={() => setValue('urgente', !watchUrgent)}
        >
          <input
            type="checkbox"
            className="w-[20px] h-[20px] accent-qe-error shrink-0 mt-0.5 rounded cursor-pointer"
            checked={watchUrgent}
            onChange={() => {}}
          />
          <div>
            <div className="text-[14px] font-bold text-qe-gray-900 flex items-center gap-1.5">
              <Zap size={16} className={watchUrgent ? 'text-qe-error fill-current' : 'text-qe-gray-400'} />
              Destacar como Urgente ⚡
            </div>
            <p className="text-[12px] text-qe-gray-500 mt-1 leading-relaxed">
              Vagas urgentes ganham borda vermelha e aparecem no topo do feed dos freelancers.
              Use para preencher vagas abertas no mesmo dia ou com alta prioridade.
            </p>
          </div>
        </div>

        {/* Botão de Envio */}
        <div className="pt-4 border-t border-qe-gray-100 flex justify-end">
          <Button
            variant="primary"
            type="submit"
            size="lg"
            className="w-full md:w-auto px-10 font-bold"
            loading={isSubmitting}
          >
            Publicar Vaga
          </Button>
        </div>
      </form>

      {/* Modal de Limite Atingido */}
      <ResponsiveSheet
        open={limitModalOpen}
        onClose={() => {
          setLimitModalOpen(false)
          navigate('/empresa/gestao')
        }}
        title="Limite de Vagas Ativas Atingido"
      >
        <div className="p-6 text-center space-y-6">
          <div className="w-16 h-16 bg-qe-error-bg rounded-full flex items-center justify-center mx-auto text-qe-error">
            <AlertTriangle size={32} />
          </div>

          <div className="space-y-2">
            <h3 className="text-[18px] font-bold text-qe-gray-900">
              Limite de 3 vagas ativas atingido
            </h3>
            <p className="text-[14px] text-qe-gray-500 leading-relaxed">
              De acordo com as regras do QueroExtra, cada estabelecimento parceiro pode manter
              até <strong>3 vagas ativas</strong> (abertas ou em andamento) simultaneamente.
            </p>
            <p className="text-[13px] text-qe-gray-400 leading-relaxed">
              Finalize ou cancele alguma de suas vagas em andamento para liberar espaço para novas publicações.
            </p>
          </div>

          <div className="pt-4">
            <Button
              variant="primary"
              className="w-full font-bold"
              onClick={() => {
                setLimitModalOpen(false)
                navigate('/empresa/gestao')
              }}
            >
              Voltar para Painel
            </Button>
          </div>
        </div>
      </ResponsiveSheet>
    </div>
  )
}
