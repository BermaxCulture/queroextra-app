import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Avatar,
  Button,
  useToast,
  EmptyState,
  ResponsiveSheet,
  Tabs,
  SkeletonCard,
} from '@/components/ui'
import type { TabItem } from '@/components/ui'
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Check,
  X,
  AlertCircle,
  Users,
} from 'lucide-react'

interface FreelancerProfile {
  id: string
  nome: string
  avatar_url: string | null
  celular: string | null
  email: string | null
}

interface Application {
  id: string
  job_id: string
  status: 'pendente' | 'aprovado' | 'rejeitado'
  created_at: string
  jobs: {
    id: string
    titulo: string
    valor: number
    categoria: string | null
    data_inicio: string | null
  } | null
  freelancers: {
    id: string
    profiles: FreelancerProfile
  } | null
}

type TabType = 'pendente' | 'aprovado' | 'rejeitado'

export default function Candidatos() {
  const { company } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = React.useState<TabType>('pendente')
  const [applications, setApplications] = React.useState<Application[]>([])
  const [loading, setLoading] = React.useState(true)

  // Estados para Modal de Confirmação de Contratação
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false)
  const [confirmAppId, setConfirmAppId] = React.useState<string | null>(null)
  const [confirmFreelancerName, setConfirmFreelancerName] = React.useState('')
  const [confirmFreelancerPhone, setConfirmFreelancerPhone] = React.useState<string | null>(null)
  const [isActionLoading, setIsActionLoading] = React.useState(false)

  const fetchApplications = React.useCallback(async () => {
    if (!company?.id) return
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          job_id,
          status,
          created_at,
          jobs!inner(
            id,
            titulo,
            valor,
            categoria,
            data_inicio,
            company_id
          ),
          freelancers(
            id,
            profiles(
              id,
              nome,
              avatar_url,
              celular,
              email
            )
          )
        `)
        .eq('jobs.company_id', company.id)
        .eq('status', activeTab)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications((data as unknown as Application[]) || [])
    } catch (err: any) {
      console.error('[Candidatos] Erro ao buscar candidaturas:', err)
      showToast('Não foi possível carregar as candidaturas.', 'error')
    } finally {
      setLoading(false)
    }
  }, [company?.id, activeTab, showToast])

  React.useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  // Inscrição em tempo real para applications
  React.useEffect(() => {
    if (!company?.id) return

    const channel = supabase
      .channel('realtime-applications-candidatos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
        },
        () => {
          console.log('[Realtime] Mudança em candidaturas detectada.')
          fetchApplications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [company?.id, fetchApplications])

  // Gatilho de Aprovação Rápida
  const triggerApprove = (appId: string, name: string, phone: string | null) => {
    setConfirmAppId(appId)
    setConfirmFreelancerName(name)
    setConfirmFreelancerPhone(phone)
    setIsConfirmOpen(true)
  }

  // Executar aprovação
  const handleApprove = async () => {
    if (!confirmAppId) return
    try {
      setIsActionLoading(true)

      const { error } = await supabase
        .from('applications')
        .update({ status: 'aprovado' })
        .eq('id', confirmAppId)

      if (error) throw error

      showToast(`Candidato ${confirmFreelancerName} aprovado com sucesso!`, 'success')
      setIsConfirmOpen(false)
      fetchApplications()
    } catch (err: any) {
      console.error('Erro ao aprovar candidato:', err)
      showToast('Erro ao aprovar candidato.', 'error')
    } finally {
      setIsActionLoading(false)
    }
  }

  // Executar rejeição
  const handleReject = async (appId: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja recusar o candidato ${name}?`)) return
    try {
      setLoading(true)

      const { error } = await supabase
        .from('applications')
        .update({ status: 'rejeitado' })
        .eq('id', appId)

      if (error) throw error

      showToast(`Candidato ${name} recusado.`, 'info')
      fetchApplications()
    } catch (err: any) {
      console.error('Erro ao rejeitar candidato:', err)
      showToast('Erro ao recusar candidato.', 'error')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Botão voltar */}
      <button
        type="button"
        onClick={() => navigate('/empresa/gestao')}
        className="flex items-center gap-2 text-[14px] text-qe-gray-500 font-bold hover:text-qe-gray-700 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Voltar para Gestão
      </button>

      {/* Cabeçalho */}
      <div>
        <h1 className="text-h1 font-bold text-qe-gray-900">Análise de Perfis</h1>
        <p className="text-[14px] text-qe-gray-500 mt-1">
          Analise e aprove profissionais qualificados que se candidataram às suas vagas.
        </p>
      </div>

      {/* Abas */}
      <Tabs
        tabs={[
          { label: 'Pendentes', value: 'pendente' },
          { label: 'Aprovados', value: 'aprovado' },
          { label: 'Recusados', value: 'rejeitado' },
        ] satisfies TabItem[]}
        activeTab={activeTab}
        onChange={(v) => setActiveTab(v as TabType)}
      />

      {/* Listagem */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<Users size={48} className="text-qe-gray-300" />}
          title="Nenhum candidato"
          description={`Nenhum profissional com status de candidatura "${activeTab}" encontrado.`}
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
                {/* Info do Freelancer */}
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
                    
                    {/* Detalhes da Vaga Associada */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[12px] text-qe-gray-500 font-medium bg-qe-gray-50 p-2 rounded border border-qe-gray-100 max-w-md">
                      <span className="text-qe-gray-900 font-bold truncate">
                        {app.jobs?.titulo}
                      </span>
                      <span>·</span>
                      <span className="capitalize">{app.jobs?.categoria || 'Extra'}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-qe-success font-bold">
                        R$ {Number(app.jobs?.valor || 0).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contatos ou Botões */}
                <div className="flex items-center gap-2 md:self-center shrink-0">
                  {activeTab === 'pendente' && (
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

                  {activeTab === 'aprovado' && (
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

                  {activeTab === 'rejeitado' && (
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
