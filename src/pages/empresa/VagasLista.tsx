import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Button,
  Badge,
  useToast,
  EmptyState,
  SkeletonCard,
  Tabs,
} from '@/components/ui'
import type { TabItem } from '@/components/ui'
import {
  Briefcase,
  Calendar,
  MapPin,
  ArrowRight,
  Sparkles,
  Shield,
  ChefHat,
  Wine,
  UserCheck,
} from 'lucide-react'
import { STATUS_LABELS } from './jobConstants'

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
  status: 'aberta' | 'em_andamento' | 'finalizada' | 'cancelada'
  urgente: boolean
  created_at: string
}

type TabType = 'todas' | 'ativas' | 'finalizadas' | 'canceladas'

const TABS: TabItem[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Ativas', value: 'ativas' },
  { label: 'Finalizadas', value: 'finalizadas' },
  { label: 'Canceladas', value: 'canceladas' },
]

function getCategoryIcon(category: string | null) {
  const cat = category?.toLowerCase() || ''
  if (cat.includes('garço') || cat.includes('atend'))
    return <UserCheck className="w-5 h-5 text-qe-yellow-text" />
  if (cat.includes('bar') || cat.includes('drink'))
    return <Wine className="w-5 h-5 text-qe-yellow-text" />
  if (cat.includes('coz') || cat.includes('aux'))
    return <ChefHat className="w-5 h-5 text-qe-yellow-text" />
  if (cat.includes('seg') || cat.includes('vig'))
    return <Shield className="w-5 h-5 text-qe-yellow-text" />
  if (cat.includes('recep') || cat.includes('host'))
    return <UserCheck className="w-5 h-5 text-qe-yellow-text" />
  return <Briefcase className="w-5 h-5 text-qe-yellow-text" />
}

function getStatusBadgeVariant(status: Job['status']) {
  switch (status) {
    case 'aberta': return 'confirmed' as const
    case 'em_andamento': return 'warning' as const
    case 'finalizada': return 'info' as const
    case 'cancelada': return 'pending' as const
  }
}

function formatJobDate(dateStr: string | null) {
  if (!dateStr) return 'A definir'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function formatJobTime(startStr: string | null, endStr: string | null) {
  if (!startStr) return 'A definir'
  const start = new Date(startStr)
  const startH = start.getHours().toString().padStart(2, '0')
  const startM = start.getMinutes().toString().padStart(2, '0')
  if (!endStr) return `${startH}:${startM}`
  const end = new Date(endStr)
  const endH = end.getHours().toString().padStart(2, '0')
  const endM = end.getMinutes().toString().padStart(2, '0')
  return `${startH}:${startM} às ${endH}:${endM}`
}

function formatLocation(job: Job) {
  if (job.estado && job.cidade) return `${job.cidade} / ${job.estado}`
  if (job.local) return job.local
  return 'Local não informado'
}

export default function VagasLista() {
  const { company } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = React.useState<TabType>('todas')
  const [jobs, setJobs] = React.useState<Job[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchJobs = React.useCallback(async () => {
    if (!company?.id) return
    try {
      setLoading(true)

      let query = supabase
        .from('jobs')
        .select('id, titulo, categoria, estado, cidade, local, valor, data_inicio, data_fim, status, urgente, created_at')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

      if (activeTab === 'ativas') {
        query = query.in('status', ['aberta', 'em_andamento'])
      } else if (activeTab === 'finalizadas') {
        query = query.eq('status', 'finalizada')
      } else if (activeTab === 'canceladas') {
        query = query.eq('status', 'cancelada')
      }

      const { data, error } = await query

      if (error) throw error
      setJobs((data as Job[]) || [])
    } catch (err: any) {
      console.error('[VagasLista] Erro ao buscar vagas:', err)
      showToast('Não foi possível carregar as vagas.', 'error')
    } finally {
      setLoading(false)
    }
  }, [company?.id, activeTab, showToast])

  React.useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-qe-gray-900">Minhas Vagas</h1>
          <p className="text-[14px] text-qe-gray-500 mt-1">
            Gerencie todas as vagas publicadas pelo seu estabelecimento.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="font-bold shrink-0"
          onClick={() => navigate('/empresa/nova-vaga')}
        >
          + Nova Vaga
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={(v) => setActiveTab(v as TabType)}
      />

      {/* Listagem */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={40} className="text-qe-gray-300" />}
          title="Nenhuma vaga encontrada"
          description="Você não possui vagas nesta categoria ainda."
          action={
            <Button variant="primary" size="sm" onClick={() => navigate('/empresa/nova-vaga')}>
              + Nova Vaga
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-qe-md border border-qe-gray-200 p-5 flex flex-col justify-between hover:border-qe-gray-300 transition-colors shadow-qe-sm"
            >
              {/* Header do card */}
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-qe-yellow-subtle flex items-center justify-center shrink-0">
                    {getCategoryIcon(job.categoria)}
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-qe-gray-900 leading-snug">
                      {job.titulo}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getStatusBadgeVariant(job.status)}>
                        {STATUS_LABELS[job.status] || job.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[18px] font-bold text-qe-gray-900">
                    R$ {Number(job.valor).toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[11px] text-qe-gray-400">/turno</div>
                </div>
              </div>

              {/* Detalhes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 my-3 text-[13px] text-qe-gray-500 border-t border-b border-qe-gray-50 py-3">
                <div className="flex items-center gap-2 font-medium">
                  <Calendar size={14} className="text-qe-gray-400" />
                  <span className="capitalize">
                    {formatJobDate(job.data_inicio)} · {formatJobTime(job.data_inicio, job.data_fim)}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <MapPin size={14} className="text-qe-gray-400 shrink-0" />
                  <span className="truncate">{formatLocation(job)}</span>
                </div>
              </div>

              {/* Ação */}
              <div className="flex justify-end pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-bold flex items-center gap-1 text-[13px] hover:text-qe-yellow-text"
                  onClick={() => navigate(`/empresa/vagas/${job.id}`)}
                >
                  Gerenciar
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
