import * as React from 'react'
import { supabase } from '@/lib/supabase'
import {
  Avatar,
  Badge,
  useToast,
  EmptyState,
  Input,
  SkeletonCard,
} from '@/components/ui'
import {
  Search,
  Star,
  Compass,
} from 'lucide-react'

interface FreelancerData {
  id: string
  habilidades: string[] | null
  profiles: {
    id: string
    nome: string
    avatar_url: string | null
  } | null
}

export default function EmpresaExplorar() {
  const { showToast } = useToast()
  const [freelancers, setFreelancers] = React.useState<FreelancerData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')

  const fetchFreelancers = React.useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('freelancers')
        .select(`
          id,
          habilidades,
          profiles(
            id,
            nome,
            avatar_url
          )
        `)

      if (error) throw error
      setFreelancers((data as unknown as FreelancerData[]) || [])
    } catch (err: any) {
      console.error('[Explorar] Erro ao buscar freelancers:', err)
      showToast('Erro ao carregar lista de profissionais.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  React.useEffect(() => {
    fetchFreelancers()
  }, [fetchFreelancers])

  // Filtrar freelancers por busca
  const filteredFreelancers = React.useMemo(() => {
    if (!search) return freelancers
    const query = search.toLowerCase()
    return freelancers.filter((f) => {
      const nameMatch = f.profiles?.nome?.toLowerCase().includes(query)
      const skillMatch = f.habilidades?.some((skill) =>
        skill.toLowerCase().includes(query)
      )
      return nameMatch || skillMatch
    })
  }, [freelancers, search])

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-h1 font-bold text-qe-gray-900">Explorar Profissionais</h1>
        <p className="text-[14px] text-qe-gray-500 mt-1">
          Conheça a comunidade de talentos e profissionais parceiros na nossa plataforma.
        </p>
      </div>

      {/* Caixa de Busca */}
      <div className="max-w-lg">
        <Input
          icon={<Search size={18} />}
          placeholder="Buscar por nome ou habilidade (ex: Garçom, Drinks...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid de Profissionais */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredFreelancers.length === 0 ? (
        <EmptyState
          icon={<Compass size={44} className="text-qe-gray-300" />}
          title="Nenhum profissional encontrado"
          description="Tente ajustar os termos de busca para encontrar freelancers."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredFreelancers.map((f) => {
            const profile = f.profiles
            if (!profile) return null

            return (
              <div
                key={f.id}
                className="bg-white rounded-qe-md border border-qe-gray-200 p-5 flex flex-col justify-between hover:border-qe-gray-300 hover:shadow-qe-md transition-all shadow-qe-sm"
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <Avatar
                    src={profile.avatar_url || undefined}
                    name={profile.nome}
                    size="md"
                    verified
                  />
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold text-qe-gray-900 truncate">
                      {profile.nome}
                    </h3>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-qe-yellow-text font-bold bg-qe-yellow-subtle px-1.5 py-0.5 rounded-qe-xs w-max">
                      <Star size={10} fill="currentColor" />
                      <span>5.0 (Excelente)</span>
                    </div>
                  </div>
                </div>

                {/* Habilidades */}
                <div className="mt-4 flex-1">
                  <div className="text-[10px] font-bold text-qe-gray-400 uppercase tracking-[0.5px] mb-1.5">
                    Habilidades
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {f.habilidades && f.habilidades.length > 0 ? (
                      f.habilidades.slice(0, 3).map((h) => (
                        <Badge key={h} variant="category">
                          {h}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[12px] text-qe-gray-400 font-medium">
                        Nenhuma informada
                      </span>
                    )}
                    {f.habilidades && f.habilidades.length > 3 && (
                      <span className="text-[11px] text-qe-gray-400 font-semibold mt-0.5">
                        +{f.habilidades.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
