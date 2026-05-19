import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  TopBar,
  Chip,
  JobCard,
  SkeletonCard,
  EmptyState,
  useToast,
  Input,
} from '@/components/ui'
import { Briefcase, Search } from 'lucide-react'

interface JobWithCompany {
  id: string
  company_id: string
  titulo: string
  local: string | null
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
  const { showToast } = useToast()
  
  const [jobs, setJobs] = React.useState<JobWithCompany[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeFilter, setActiveFilter] = React.useState('Todos os Tipos')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [showSearchInput, setShowSearchInput] = React.useState(false)

  // Carregar vagas
  const fetchJobs = React.useCallback(async () => {
    console.log('[VagasExplorarPage] fetchJobs: iniciando busca de vagas no Supabase...')
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('jobs')
        .select('*, companies(profiles(nome, avatar_url))')
        .eq('status', 'aberta')
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log('[VagasExplorarPage] fetchJobs: vagas carregadas com sucesso. Quantidade:', data?.length)
      setJobs((data as unknown as JobWithCompany[]) || [])
    } catch (err: any) {
      console.error('[VagasExplorarPage] fetchJobs: erro ao carregar vagas:', err)
      const msg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err))
      showToast(`Erro ao carregar vagas: ${msg}`, 'error')
    } finally {
      setLoading(false)
      console.log('[VagasExplorarPage] fetchJobs: finalizado.')
    }
  }, [showToast])

  React.useEffect(() => {
    console.log('[VagasExplorarPage] useEffect: componente montado, chamando fetchJobs...')
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

    // Filtro por termo de busca
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (job) =>
          job.titulo.toLowerCase().includes(term) ||
          job.categoria?.toLowerCase().includes(term) ||
          job.companies?.profiles.nome.toLowerCase().includes(term) ||
          job.local?.toLowerCase().includes(term)
      )
    }

    // Filtros de Categoria
    if (activeFilter === 'Garçom') {
      result = result.filter((job) => job.categoria?.toLowerCase() === 'garçom' || job.categoria?.toLowerCase() === 'garconete')
    } else if (activeFilter === 'Cozinha') {
      result = result.filter(
        (job) =>
          job.categoria?.toLowerCase().includes('cozinha') ||
          job.categoria?.toLowerCase().includes('cozinheiro') ||
          job.categoria?.toLowerCase().includes('auxiliar de cozinha')
      )
    } else if (activeFilter === 'Bartender') {
      result = result.filter((job) => job.categoria?.toLowerCase() === 'bartender')
    }

    // Filtros de Ordenação / Tipo
    if (activeFilter === 'Maior Valor') {
      result.sort((a, b) => b.valor - a.valor)
    } else if (activeFilter === 'Mais Próximo') {
      // Mock de ordenação por distância fictícia (jobs com id de caractere ímpar aparecem antes)
      result.sort((a, b) => (a.id < b.id ? -1 : 1))
    }

    return result
  }, [jobs, activeFilter, searchTerm])

  const filters = [
    'Todos os Tipos',
    'Maior Valor',
    'Mais Próximo',
    'Garçom',
    'Cozinha',
    'Bartender',
  ]

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

      {/* Header local apenas para Desktop */}
      <header className="hidden lg:flex bg-white border-b border-qe-gray-100 px-8 py-5 items-center justify-between sticky top-0 z-10 shadow-qe-sm">
        <div>
          <h1 className="text-[20px] font-bold text-qe-gray-900">Explorar Extras</h1>
          <p className="text-[13px] text-qe-gray-400 mt-1">Encontre os melhores turnos e estabelecimentos parceiros.</p>
        </div>
        {/* Barra de busca permanente para desktop */}
        <div className="w-80">
          <Input
            icon={<Search size={16} />}
            placeholder="Buscar por cargo, empresa ou local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Input de busca dinâmico (apenas mobile) */}
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
            onClick={() => {
              setSearchTerm('')
              setShowSearchInput(false)
            }}
            className="text-[13px] text-qe-gray-500 font-medium px-2 py-1 shrink-0"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Container com largura máxima responsiva */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-6">
        
        {/* Filtros deslizáveis */}
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

        {/* Título de seção com contagem */}
        <div className="flex justify-between items-center border-b border-qe-gray-100 pb-3">
          <h2 className="text-h2 font-bold text-qe-gray-900">Vagas Disponíveis</h2>
          <span className="text-[12px] text-qe-gray-400 font-bold bg-qe-gray-50 px-2 py-1 rounded border border-qe-gray-200">
            {processedJobs.length} {processedJobs.length === 1 ? 'vaga' : 'vagas'}
          </span>
        </div>

        {/* Grid Responsivo de Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : processedJobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-12 h-12 text-qe-gray-300" />}
            title="Nenhum extra disponível"
            description="Não encontramos vagas abertas com esses critérios. Tente limpar os filtros ou volte mais tarde!"
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
                  location={job.local || 'Local não informado'}
                  distance="Mock · 2.5 km"
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
