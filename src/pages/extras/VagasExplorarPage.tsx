import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  TopBar,
  Chip,
  JobCard,
  SkeletonCard,
  EmptyState,
  useToast,
  Input,
} from '@/components/ui'
import { Briefcase, Search, MapPin, X } from 'lucide-react'

interface JobWithCompany {
  id: string
  company_id: string
  titulo: string
  local: string | null
  cidade: string | null
  estado: string | null
  valor: number
  data_inicio: string | null
  data_fim: string | null
  descricao: string | null
  categoria: string | null
  tags: string[] | null
  status: string
  urgente: boolean
  created_at: string
  companies: {
    profiles: {
      nome: string
      avatar_url: string | null
    }
  } | null
}

export default function VagasExplorarPage() {
  const navigate = useNavigate()
  const { freelancer } = useAuth()
  const { showToast } = useToast()

  const [jobs, setJobs] = React.useState<JobWithCompany[]>([])
  const [appliedJobIds, setAppliedJobIds] = React.useState<Set<string>>(new Set())
  const [loading, setLoading] = React.useState(true)
  const [activeFilter, setActiveFilter] = React.useState('Todos os Tipos')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [showSearchInput, setShowSearchInput] = React.useState(false)

  // Filtros de localização
  const [cidadeFilter, setCidadeFilter] = React.useState('')
  const [estadoFilter, setEstadoFilter] = React.useState('')
  const [showLocationFilter, setShowLocationFilter] = React.useState(false)

  // Lista de cidades/estados disponíveis nas vagas
  const [availableCidades, setAvailableCidades] = React.useState<string[]>([])
  const [availableEstados, setAvailableEstados] = React.useState<string[]>([])

  // Carregar vagas + candidaturas do freelancer
  const fetchJobs = React.useCallback(async () => {
    try {
      setLoading(true)

      // Buscar vagas abertas
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*, companies(profiles(nome, avatar_url))')
        .eq('status', 'aberta')
        .order('created_at', { ascending: false })

      if (jobsError) throw jobsError

      const jobsList = (jobsData as unknown as JobWithCompany[]) || []
      setJobs(jobsList)

      // Extrair cidades e estados únicos
      const cidades = [...new Set(jobsList.map((j) => j.cidade).filter(Boolean) as string[])].sort()
      const estados = [...new Set(jobsList.map((j) => j.estado).filter(Boolean) as string[])].sort()
      setAvailableCidades(cidades)
      setAvailableEstados(estados)

      // Buscar IDs das vagas em que o freelancer já se candidatou
      if (freelancer?.id) {
        const { data: appsData, error: appsError } = await supabase
          .from('applications')
          .select('job_id')
          .eq('freelancer_id', freelancer.id)

        if (appsError) throw appsError
        const ids = new Set((appsData || []).map((a: { job_id: string }) => a.job_id))
        setAppliedJobIds(ids)
      }
    } catch (err: any) {
      const msg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err))
      showToast(`Erro ao carregar vagas: ${msg}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [freelancer?.id, showToast])

  React.useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Formatar Data
  const formatJobDate = (dateStr: string | null) => {
    if (!dateStr) return 'A definir'
    const date = new Date(dateStr)
    const hoje = new Date()
    const amanha = new Date()
    amanha.setDate(hoje.getDate() + 1)

    const isHoje = date.toDateString() === hoje.toDateString()
    const isAmanha = date.toDateString() === amanha.toDateString()

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
    const formattedDate = date.toLocaleDateString('pt-BR', options)

    if (isHoje) return `Hoje, ${formattedDate}`
    if (isAmanha) return `Amanhã, ${formattedDate}`
    return formattedDate
  }

  // Formatar Horário
  const formatJobTime = (startStr: string | null, endStr: string | null) => {
    if (!startStr) return 'A definir'
    const start = new Date(startStr)
    const startHours = start.getHours().toString().padStart(2, '0')
    const startMinutes = start.getMinutes().toString().padStart(2, '0')

    if (!endStr) return `${startHours}:${startMinutes}`

    const end = new Date(endStr)
    const endHours = end.getHours().toString().padStart(2, '0')
    const endMinutes = end.getMinutes().toString().padStart(2, '0')

    return `${startHours}:${startMinutes} — ${endHours}:${endMinutes}`
  }

  // Filtrar e ordenar localmente
  const processedJobs = React.useMemo(() => {
    let result = [...jobs]

    // Ocultar vagas em que o freelancer já se candidatou
    result = result.filter((job) => !appliedJobIds.has(job.id))

    // Filtro por termo de busca
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (job) =>
          job.titulo.toLowerCase().includes(term) ||
          job.categoria?.toLowerCase().includes(term) ||
          job.companies?.profiles.nome.toLowerCase().includes(term) ||
          job.local?.toLowerCase().includes(term) ||
          job.cidade?.toLowerCase().includes(term) ||
          job.estado?.toLowerCase().includes(term)
      )
    }

    // Filtro por cidade
    if (cidadeFilter) {
      result = result.filter((job) =>
        job.cidade?.toLowerCase() === cidadeFilter.toLowerCase()
      )
    }

    // Filtro por estado
    if (estadoFilter) {
      result = result.filter((job) =>
        job.estado?.toLowerCase() === estadoFilter.toLowerCase()
      )
    }

    // Filtros de Categoria
    if (activeFilter === 'Garçom') {
      result = result.filter(
        (job) =>
          job.categoria?.toLowerCase().includes('garço') ||
          job.categoria?.toLowerCase().includes('garconete')
      )
    } else if (activeFilter === 'Cozinha') {
      result = result.filter(
        (job) =>
          job.categoria?.toLowerCase().includes('cozinha') ||
          job.categoria?.toLowerCase().includes('cozinheiro')
      )
    } else if (activeFilter === 'Bartender') {
      result = result.filter((job) => job.categoria?.toLowerCase() === 'bartender')
    }

    // Filtros de Ordenação
    if (activeFilter === 'Maior Valor') {
      result.sort((a, b) => b.valor - a.valor)
    } else if (activeFilter === 'Mais Próximo') {
      result.sort((a, b) => (a.id < b.id ? -1 : 1))
    }

    return result
  }, [jobs, appliedJobIds, activeFilter, searchTerm, cidadeFilter, estadoFilter])

  const filters = [
    'Todos os Tipos',
    'Maior Valor',
    'Mais Próximo',
    'Garçom',
    'Cozinha',
    'Bartender',
  ]

  const hasLocationFilter = cidadeFilter || estadoFilter

  const clearLocationFilters = () => {
    setCidadeFilter('')
    setEstadoFilter('')
  }

  return (
    <div className="pb-24 lg:pb-8 bg-qe-bg-page min-h-screen">
      {/* TopBar Principal - apenas no Mobile */}
      <div className="lg:hidden">
        <TopBar
          variant="main"
          onSearch={() => setShowSearchInput(!showSearchInput)}
          onNotification={() => showToast('Nenhuma notificação recente', 'info')}
          onProfile={() => navigate('/extras/perfil')}
        />
      </div>

      {/* Header Desktop */}
      <header className="hidden lg:flex bg-white border-b border-qe-gray-100 px-8 py-5 items-center justify-between sticky top-0 z-10 shadow-qe-sm">
        <div>
          <h1 className="text-[20px] font-bold text-qe-gray-900">Explorar Extras</h1>
          <p className="text-[13px] text-qe-gray-400 mt-1">Encontre os melhores turnos e estabelecimentos parceiros.</p>
        </div>
        <div className="w-80">
          <Input
            icon={<Search size={16} />}
            placeholder="Buscar por cargo, empresa ou local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Input de busca dinâmico (mobile) */}
      {showSearchInput && (
        <div className="lg:hidden px-4 py-2 bg-white border-b border-qe-gray-100 flex gap-2 items-center">
          <div className="flex-1">
            <Input
              icon={<Search size={16} />}
              placeholder="Buscar por cargo, empresa ou local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <button
            onClick={() => { setSearchTerm(''); setShowSearchInput(false) }}
            className="text-[13px] text-qe-gray-500 font-medium px-2 py-1 shrink-0"
          >
            Cancelar
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-5">

        {/* Filtros de categoria deslizáveis */}
        <div className="overflow-x-auto whitespace-nowrap py-1 flex gap-2 scrollbar-none">
          {filters.map((f) => (
            <Chip
              key={f}
              label={f}
              variant="skill"
              selected={activeFilter === f}
              onClick={() => setActiveFilter(f)}
            />
          ))}
        </div>

        {/* Filtros de Localização */}
        <div className="space-y-3">
          <button
            onClick={() => setShowLocationFilter(!showLocationFilter)}
            className={`flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-qe-pill border transition-colors ${
              hasLocationFilter
                ? 'bg-qe-yellow-subtle border-qe-yellow text-qe-yellow-text'
                : 'bg-white border-qe-gray-200 text-qe-gray-600 hover:border-qe-gray-300'
            }`}
          >
            <MapPin size={14} />
            {hasLocationFilter
              ? `${[cidadeFilter, estadoFilter].filter(Boolean).join(' · ')}`
              : 'Filtrar por localização'}
            {hasLocationFilter && (
              <span
                onClick={(e) => { e.stopPropagation(); clearLocationFilters() }}
                className="ml-1 hover:text-red-500 transition-colors"
              >
                <X size={13} />
              </span>
            )}
          </button>

          {showLocationFilter && (
            <div className="bg-white border border-qe-gray-200 rounded-qe-md p-4 shadow-qe-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Filtro Estado */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-qe-gray-400 uppercase tracking-[0.5px]">Estado</label>
                  <select
                    value={estadoFilter}
                    onChange={(e) => setEstadoFilter(e.target.value)}
                    className="w-full h-10 border border-qe-gray-200 rounded-qe-sm px-3 text-[14px] text-qe-gray-700 focus:outline-none focus:border-qe-yellow transition-colors bg-white"
                  >
                    <option value="">Todos os estados</option>
                    {availableEstados.map((est) => (
                      <option key={est} value={est}>{est}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro Cidade */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-qe-gray-400 uppercase tracking-[0.5px]">Cidade</label>
                  <select
                    value={cidadeFilter}
                    onChange={(e) => setCidadeFilter(e.target.value)}
                    className="w-full h-10 border border-qe-gray-200 rounded-qe-sm px-3 text-[14px] text-qe-gray-700 focus:outline-none focus:border-qe-yellow transition-colors bg-white"
                  >
                    <option value="">Todas as cidades</option>
                    {availableCidades
                      .filter((c) => !estadoFilter || jobs.some((j) => j.cidade === c && j.estado === estadoFilter))
                      .map((cidade) => (
                        <option key={cidade} value={cidade}>{cidade}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={clearLocationFilters}
                  className="text-[12px] font-semibold text-qe-gray-500 px-3 py-1.5 hover:text-qe-gray-700 transition-colors"
                >
                  Limpar
                </button>
                <button
                  onClick={() => setShowLocationFilter(false)}
                  className="text-[12px] font-semibold bg-qe-yellow text-qe-navy px-4 py-1.5 rounded-qe-pill hover:opacity-90 transition-opacity"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Título de seção com contagem */}
        <div className="flex justify-between items-center border-b border-qe-gray-100 pb-3">
          <h2 className="text-h2 font-bold text-qe-gray-900">Vagas Disponíveis</h2>
          <span className="text-[12px] text-qe-gray-400 font-bold bg-qe-gray-50 px-2 py-1 rounded border border-qe-gray-200">
            {processedJobs.length} {processedJobs.length === 1 ? 'vaga' : 'vagas'}
          </span>
        </div>

        {/* Grid de Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : processedJobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-12 h-12 text-qe-gray-300" />}
            title={hasLocationFilter || searchTerm ? 'Nenhum resultado' : 'Nenhum extra disponível'}
            description={
              hasLocationFilter || searchTerm
                ? 'Tente ajustar os filtros ou a busca para encontrar vagas.'
                : 'Não há vagas abertas no momento. Volte mais tarde!'
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => navigate(`/extras/vaga/${job.id}`)}
                className="cursor-pointer"
              >
                <JobCard
                  category={job.categoria || 'EXTRA'}
                  title={job.titulo}
                  companyName={job.companies?.profiles.nome || 'Empresa parceira'}
                  location={
                    [job.local, job.cidade, job.estado].filter(Boolean).join(', ') ||
                    'Local não informado'
                  }
                  distance={job.cidade ? `${job.cidade}${job.estado ? ` · ${job.estado}` : ''}` : 'Mock · 2.5 km'}
                  date={formatJobDate(job.data_inicio)}
                  time={formatJobTime(job.data_inicio, job.data_fim)}
                  value={Number(job.valor)}
                  isUrgent={job.urgente}
                  tags={job.tags || []}
                  onApply={() => navigate(`/extras/vaga/${job.id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
