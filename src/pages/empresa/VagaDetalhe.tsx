import * as React from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import {
  Button,
  Input,
  Select,
  Badge,
  Avatar,
  useToast,
  EmptyState,
  SkeletonCard,
  Tabs,
  ResponsiveSheet,
} from '@/components/ui'
import type { TabItem } from '@/components/ui'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  Gift,
  Zap,
  AlertCircle,
  Check,
  X,
  Phone,
  MessageCircle,
  Users,
} from 'lucide-react'
import { JOB_CATEGORIES, BRAZIL_STATES, STATUS_LABELS } from './jobConstants'

interface Job {
  id: string
  titulo: string
  categoria: string | null
  estado: string | null
  cidade: string | null
  local: string | null
  valor: number
  data_inicio: string | null
  data_fim: string | null
  descricao: string | null
  beneficios: string | null
  tags: string[] | null
  urgente: boolean
  status: 'aberta' | 'em_andamento' | 'finalizada' | 'cancelada'
  created_at: string
}

interface Application {
  id: string
  status: 'pendente' | 'aprovado' | 'rejeitado'
  created_at: string
  freelancers: {
    id: string
    profiles: {
      id: string
      nome: string
      avatar_url: string | null
      celular: string | null
      email: string | null
    }
  } | null
}

const editJobSchema = z.object({
  titulo: z.string().min(5).max(80),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  estado: z.string().min(2, 'Selecione o estado'),
  cidade: z.string().min(2, 'Informe a cidade'),
  local: z.string().min(5, 'Informe o endereço'),
  valor: z.coerce.number().min(50, 'Valor mínimo R$ 50,00'),
  data_inicio: z.string().min(1),
  data_fim: z.string().min(1),
  descricao: z.string().min(10),
  beneficios: z.string().optional(),
  urgente: z.boolean().default(false),
})

type EditJobFormData = z.infer<typeof editJobSchema>

type MainTab = 'detalhes' | 'candidatos'
type CandidateTab = 'pendente' | 'aprovado' | 'rejeitado'

const MAIN_TABS: TabItem[] = [
  { label: 'Detalhes', value: 'detalhes' },
  { label: 'Candidatos', value: 'candidatos' },
]

const CANDIDATE_TABS: TabItem[] = [
  { label: 'Pendentes', value: 'pendente' },
  { label: 'Aprovados', value: 'aprovado' },
  { label: 'Recusados', value: 'rejeitado' },
]

function formatDateTime(iso: string | null) {
  if (!iso) return 'Não informado'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toDatetimeLocal(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 16)
}

function getStatusBadgeVariant(status: Job['status']) {
  switch (status) {
    case 'aberta': return 'confirmed' as const
    case 'em_andamento': return 'warning' as const
    case 'finalizada': return 'info' as const
    case 'cancelada': return 'pending' as const
  }
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-bold uppercase tracking-wide text-qe-gray-400">{label}</div>
      <div className="text-[14px] text-qe-gray-900">{value || 'Não informado'}</div>
    </div>
  )
}

export default function VagaDetalhe() {
  const { id: jobId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [job, setJob] = React.useState<Job | null>(null)
  const [loadingJob, setLoadingJob] = React.useState(true)
  const [isEditMode, setIsEditMode] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])

  const initialTab = searchParams.get('tab') === 'candidatos' ? 'candidatos' : 'detalhes'
  const [activeMainTab, setActiveMainTab] = React.useState<MainTab>(initialTab as MainTab)

  const [activeCandidateTab, setActiveCandidateTab] = React.useState<CandidateTab>('pendente')
  const [applications, setApplications] = React.useState<Application[]>([])
  const [loadingApps, setLoadingApps] = React.useState(false)

  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false)
  const [confirmAppId, setConfirmAppId] = React.useState<string | null>(null)
  const [confirmFreelancerName, setConfirmFreelancerName] = React.useState('')
  const [confirmFreelancerPhone, setConfirmFreelancerPhone] = React.useState<string | null>(null)
  const [isActionLoading, setIsActionLoading] = React.useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<EditJobFormData>({
    resolver: zodResolver(editJobSchema) as any,
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
      urgente: false,
    },
  })

  const watchUrgent = watch('urgente')

  const loadJob = React.useCallback(async () => {
    if (!jobId) return
    try {
      setLoadingJob(true)
      const { data, error } = await supabase
        .from('jobs')
        .select('id, titulo, categoria, estado, cidade, local, valor, data_inicio, data_fim, descricao, beneficios, tags, urgente, status, created_at')
        .eq('id', jobId)
        .single()

      if (error) throw error

      const loaded = data as Job
      setJob(loaded)
      setSelectedTags(loaded.tags || [])
      reset({
        titulo: loaded.titulo,
        categoria: loaded.categoria || '',
        estado: loaded.estado || '',
        cidade: loaded.cidade || '',
        local: loaded.local || '',
        valor: loaded.valor,
        data_inicio: toDatetimeLocal(loaded.data_inicio),
        data_fim: toDatetimeLocal(loaded.data_fim),
        descricao: loaded.descricao || '',
        beneficios: loaded.beneficios || '',
        urgente: loaded.urgente,
      })
    } catch (err: any) {
      console.error('[VagaDetalhe] Erro ao carregar vaga:', err)
      showToast('Não foi possível carregar os dados da vaga.', 'error')
    } finally {
      setLoadingJob(false)
    }
  }, [jobId, reset, showToast])

  React.useEffect(() => {
    loadJob()
  }, [loadJob])

  const loadApplications = React.useCallback(async () => {
    if (!jobId) return
    try {
      setLoadingApps(true)
      const { data, error } = await supabase
        .from('applications')
        .select('id, job_id, status, created_at, freelancers(id, profiles(id, nome, avatar_url, celular, email))')
        .eq('job_id', jobId)
        .eq('status', activeCandidateTab)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications((data as unknown as Application[]) || [])
    } catch (err: any) {
      console.error('[VagaDetalhe] Erro ao carregar candidatos:', err)
      showToast('Não foi possível carregar os candidatos.', 'error')
    } finally {
      setLoadingApps(false)
    }
  }, [jobId, activeCandidateTab, showToast])

  React.useEffect(() => {
    if (activeMainTab === 'candidatos') {
      loadApplications()
    }
  }, [activeMainTab, loadApplications])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const onSubmitEdit = async (data: EditJobFormData) => {
    if (!jobId) return
    try {
      setIsSubmitting(true)
      const { error } = await supabase
        .from('jobs')
        .update({
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
          tags: selectedTags,
        })
        .eq('id', jobId)

      if (error) throw error

      showToast('Vaga atualizada com sucesso!', 'success')
      setIsEditMode(false)
      loadJob()
    } catch (err: any) {
      console.error('[VagaDetalhe] Erro ao salvar vaga:', err)
      showToast('Não foi possível salvar as alterações.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const triggerApprove = (appId: string, name: string, phone: string | null) => {
    setConfirmAppId(appId)
    setConfirmFreelancerName(name)
    setConfirmFreelancerPhone(phone)
    setIsConfirmOpen(true)
  }

  const handleApprove = async () => {
    if (!confirmAppId) return
    try {
      setIsActionLoading(true)
      const { error } = await supabase
        .from('applications')
        .update({ status: 'aprovado' })
        .eq('id', confirmAppId)

      if (error) throw error

      showToast(`${confirmFreelancerName} aprovado com sucesso!`, 'success')
      setIsConfirmOpen(false)
      loadApplications()
    } catch (err: any) {
      console.error('Erro ao aprovar:', err)
      showToast('Erro ao aprovar candidato.', 'error')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleReject = async (appId: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja recusar o candidato ${name}?`)) return
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'rejeitado' })
        .eq('id', appId)

      if (error) throw error

      showToast(`${name} recusado.`, 'info')
      loadApplications()
    } catch (err: any) {
      console.error('Erro ao rejeitar:', err)
      showToast('Erro ao recusar candidato.', 'error')
    }
  }

  if (loadingJob) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-4 w-24 shimmer rounded" />
        <div className="h-8 w-64 shimmer rounded" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState
          icon={<FileText size={48} className="text-qe-gray-300" />}
          title="Vaga não encontrada"
          description="Esta vaga não existe ou você não tem acesso a ela."
          action={
            <Button variant="primary" size="sm" onClick={() => navigate('/empresa/vagas')}>
              Voltar para Vagas
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Botão voltar */}
      <button
        type="button"
        onClick={() => navigate('/empresa/vagas')}
        className="flex items-center gap-2 text-[14px] text-qe-gray-500 font-bold hover:text-qe-gray-700 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Voltar para Vagas
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-h1 font-bold text-qe-gray-900 leading-snug">{job.titulo}</h1>
          <div className="mt-2">
            <Badge variant={getStatusBadgeVariant(job.status)}>
              {STATUS_LABELS[job.status] || job.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs principais */}
      <Tabs
        tabs={MAIN_TABS}
        activeTab={activeMainTab}
        onChange={(v) => {
          setActiveMainTab(v as MainTab)
          setIsEditMode(false)
        }}
      />

      {/* Aba Detalhes */}
      {activeMainTab === 'detalhes' && (
        <div className="bg-white rounded-qe-md border border-qe-gray-200 p-6 md:p-8 shadow-qe-sm space-y-6">
          {!isEditMode ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailField label="Título" value={job.titulo} />
                <DetailField label="Categoria" value={job.categoria} />
                <DetailField label="Estado" value={job.estado} />
                <DetailField label="Cidade" value={job.cidade} />
                <DetailField label="Endereço" value={job.local} />
                <DetailField
                  label="Valor / Turno"
                  value={`R$ ${Number(job.valor).toLocaleString('pt-BR')}`}
                />
                <DetailField label="Data de Início" value={formatDateTime(job.data_inicio)} />
                <DetailField label="Data de Término" value={formatDateTime(job.data_fim)} />
                <div className="md:col-span-2">
                  <DetailField label="Descrição" value={job.descricao} />
                </div>
                <div className="md:col-span-2">
                  <DetailField label="Benefícios" value={job.beneficios} />
                </div>
                <div className="md:col-span-2">
                  <DetailField
                    label="Tags"
                    value={
                      job.tags && job.tags.length > 0
                        ? job.tags.join(', ')
                        : 'Nenhuma tag'
                    }
                  />
                </div>
                <DetailField
                  label="Urgente"
                  value={job.urgente ? 'Sim ⚡' : 'Não'}
                />
              </div>

              <div className="pt-4 border-t border-qe-gray-100 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  className="font-bold"
                  onClick={() => setIsEditMode(true)}
                >
                  Editar Vaga
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-6">
              <Input
                label="Título da Vaga"
                placeholder="Ex: Garçom para Evento de Casamento"
                errorMessage={errors.titulo?.message}
                {...register('titulo')}
              />

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

              <Input
                label="Endereço Completo do Local"
                placeholder="Rua, número, bairro — Cidade/UF"
                icon={<MapPin size={18} />}
                errorMessage={errors.local?.message}
                {...register('local')}
              />

              <Input
                label="Valor do Turno (R$)"
                type="number"
                placeholder="Ex: 150"
                icon={<DollarSign size={18} />}
                errorMessage={errors.valor?.message}
                {...register('valor')}
              />

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

              <div className="space-y-2 border-t border-qe-gray-100 pt-4">
                <label className="text-[13px] font-semibold text-qe-gray-700">
                  Tags <span className="font-normal text-qe-gray-400">(opcional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {['INÍCIO IMEDIATO', 'TURNO DA NOITE', 'FIM DE SEMANA'].map((tag) => {
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
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-qe-gray-100 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setIsEditMode(false)
                    if (job) {
                      setSelectedTags(job.tags || [])
                      reset({
                        titulo: job.titulo,
                        categoria: job.categoria || '',
                        estado: job.estado || '',
                        cidade: job.cidade || '',
                        local: job.local || '',
                        valor: job.valor,
                        data_inicio: toDatetimeLocal(job.data_inicio),
                        data_fim: toDatetimeLocal(job.data_fim),
                        descricao: job.descricao || '',
                        beneficios: job.beneficios || '',
                        urgente: job.urgente,
                      })
                    }
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  className="font-bold"
                  loading={isSubmitting}
                >
                  Salvar Alterações
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Aba Candidatos */}
      {activeMainTab === 'candidatos' && (
        <div className="space-y-4">
          <Tabs
            tabs={CANDIDATE_TABS}
            activeTab={activeCandidateTab}
            onChange={(v) => setActiveCandidateTab(v as CandidateTab)}
          />

          {loadingApps ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : applications.length === 0 ? (
            <EmptyState
              icon={<Users size={48} className="text-qe-gray-300" />}
              title="Nenhum candidato"
              description={`Nenhum candidato com status "${activeCandidateTab}" para esta vaga.`}
            />
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const freelancer = app.freelancers?.profiles
                if (!freelancer) return null

                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-qe-md border border-qe-gray-200 p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-qe-gray-300 transition-colors shadow-qe-sm"
                  >
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
                        <p className="text-[12px] text-qe-gray-400 font-medium">
                          Candidatou-se em: {new Date(app.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:self-center shrink-0">
                      {activeCandidateTab === 'pendente' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="bg-qe-error-bg text-qe-error border-none hover:bg-qe-error/20 flex items-center justify-center p-2 rounded-full w-10 h-10"
                            onClick={() => handleReject(app.id, freelancer.nome)}
                            title="Recusar"
                          >
                            <X size={18} />
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-qe-success-bg text-qe-success border-none hover:bg-qe-success/20 flex items-center justify-center p-2 rounded-full w-10 h-10"
                            onClick={() => triggerApprove(app.id, freelancer.nome, freelancer.celular)}
                            title="Aprovar"
                          >
                            <Check size={18} />
                          </Button>
                        </>
                      )}

                      {activeCandidateTab === 'aprovado' && (
                        <div className="flex flex-col md:items-end gap-2">
                          <div className="flex items-center gap-1.5 text-qe-success font-bold text-[13px]">
                            <Check size={16} /> Aprovado
                          </div>
                          {freelancer.celular && (
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={`tel:${freelancer.celular}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-qe-gray-50 border border-qe-gray-200 text-qe-gray-700 text-[12px] font-bold rounded-qe-sm hover:border-qe-gray-300 transition-all cursor-pointer"
                              >
                                <Phone size={13} />
                                Ligar
                              </a>
                              <a
                                href={`https://wa.me/55${freelancer.celular.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-[12px] font-bold rounded-qe-sm hover:bg-[#20ba59] transition-all cursor-pointer"
                              >
                                <MessageCircle size={13} />
                                WhatsApp
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {activeCandidateTab === 'rejeitado' && (
                        <span className="text-qe-error font-bold text-[13px] flex items-center gap-1.5 bg-qe-error-bg px-3 py-1.5 rounded-qe-xs border border-qe-error/20">
                          <X size={14} /> Recusado
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Confirmação de Aprovação */}
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
              onClick={handleApprove}
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
