import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { BottomNav, TopBar, Button, Sidebar } from '@/components/ui'
import type { SidebarItem } from '@/components/ui'
import { Plus, Compass, LayoutGrid, Wallet, User, Briefcase } from 'lucide-react'
import EmpresaDashboard from '../empresa/EmpresaDashboard'
import NovaVaga from '../empresa/NovaVaga'
import Candidatos from '../empresa/Candidatos'
import EmpresaCarteira from '../empresa/EmpresaCarteira'
import EmpresaPerfil from '../empresa/EmpresaPerfil'
import EmpresaExplorar from '../empresa/EmpresaExplorar'
import VagasLista from '../empresa/VagasLista'
import VagaDetalhe from '../empresa/VagaDetalhe'

const empresaItems: SidebarItem[] = [
  { value: '/empresa/gestao',   label: 'Gestão',    icon: <LayoutGrid size={20} /> },
  { value: '/empresa/vagas',    label: 'Vagas',     icon: <Briefcase size={20} /> },
  { value: '/empresa/explorar', label: 'Explorar',  icon: <Compass size={20} /> },
  { value: '/empresa/carteira', label: 'Carteira',  icon: <Wallet size={20} /> },
  { value: '/empresa/perfil',   label: 'Perfil',    icon: <User size={20} /> },
]

export default function ContratanteHome() {
  const { company, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isApproved = company?.status === 'aprovado'

  const getActiveTab = () => {
    const path = location.pathname
    if (path.includes('/empresa/explorar')) return 'explorar'
    if (path.includes('/empresa/carteira')) return 'carteira'
    if (path.includes('/empresa/perfil')) return 'perfil'
    if (path.includes('/empresa/vagas')) return 'gestao'
    return 'gestao'
  }

  const getMobileTitle = () => {
    const path = location.pathname
    if (path.includes('/empresa/explorar')) return 'Explorar Extras'
    if (path.includes('/empresa/carteira')) return 'Minha Carteira'
    if (path.includes('/empresa/perfil')) return 'Meu Perfil'
    if (path.includes('/empresa/nova-vaga')) return 'Publicar Vaga'
    if (path.includes('/empresa/candidatos')) return 'Candidatos'
    if (/\/empresa\/vagas\/[^/]+/.test(path)) return 'Detalhe da Vaga'
    if (path === '/empresa/vagas') return 'Minhas Vagas'
    return 'Painel de Gestão'
  }

  const handleTabChange = (value: string) => {
    if (value === 'explorar') navigate('/empresa/explorar')
    else if (value === 'carteira') navigate('/empresa/carteira')
    else if (value === 'perfil') navigate('/empresa/perfil')
    else navigate('/empresa/gestao')
  }

  const getBackPath = () => {
    const path = location.pathname
    if (/\/empresa\/vagas\/.+/.test(path)) return '/empresa/vagas'
    return '/empresa/gestao'
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen bg-qe-bg-page flex items-center justify-center p-6">
        <div className="bg-white rounded-qe-md border border-qe-gray-200 p-8 max-w-md text-center space-y-6 shadow-qe-sm">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
            <User size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-[18px] font-bold text-qe-gray-900">Aguardando Aprovação</h2>
            <p className="text-[14px] text-qe-gray-500 leading-relaxed">
              O cadastro da sua empresa está em fase de análise pela nossa equipe de moderação.
            </p>
          </div>
          <Button variant="primary" className="w-full font-bold" onClick={signOut}>
            Encerrar Sessão
          </Button>
        </div>
      </div>
    )
  }

  const activeTab = getActiveTab()
  const isInnerPage =
    location.pathname.includes('/nova-vaga') ||
    location.pathname.includes('/candidatos') ||
    /\/empresa\/vagas\/.+/.test(location.pathname)

  const sidebarFooter = (
    <Button
      variant="primary"
      size="sm"
      className="w-full font-bold flex items-center justify-center gap-1.5"
      onClick={() => navigate('/empresa/nova-vaga')}
    >
      <Plus size={16} /> Nova Vaga
    </Button>
  )

  const activeItemPath = location.pathname.startsWith('/empresa/vagas')
    ? '/empresa/vagas'
    : location.pathname

  return (
    <div className="min-h-screen bg-qe-bg-page font-sans lg:flex">
      {/* SIDEBAR DESKTOP */}
      <Sidebar
        items={empresaItems}
        activeItem={activeItemPath}
        onChange={(path) => navigate(path)}
        role="empresa"
        footer={sidebarFooter}
      />

      {/* COLUNA PRINCIPAL */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* BARRA SUPERIOR MOBILE */}
        <div className="lg:hidden sticky top-0 z-40">
          <TopBar
            variant={isInnerPage ? 'inner' : 'main'}
            title={getMobileTitle()}
            onBack={isInnerPage ? () => navigate(getBackPath()) : undefined}
            onNotification={() => {}}
            notificationCount={1}
            onProfile={() => navigate('/empresa/perfil')}
          />
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-1 px-4 md:px-8 py-6 pb-24 lg:pb-8">
          <Routes>
            <Route path="gestao" element={<EmpresaDashboard />} />
            <Route path="nova-vaga" element={<NovaVaga />} />
            <Route path="candidatos" element={<Candidatos />} />
            <Route path="vagas" element={<VagasLista />} />
            <Route path="vagas/:id" element={<VagaDetalhe />} />
            <Route path="explorar" element={<EmpresaExplorar />} />
            <Route path="carteira" element={<EmpresaCarteira />} />
            <Route path="perfil" element={<EmpresaPerfil />} />
            <Route path="" element={<Navigate to="gestao" replace />} />
          </Routes>
        </main>

        {/* BARRA INFERIOR MOBILE */}
        <footer className="lg:hidden fixed bottom-0 left-0 right-0 z-40 shadow-qe-lg">
          <BottomNav
            variant="empresa"
            activeTab={activeTab}
            onChange={handleTabChange}
            notifications={{ gestao: true }}
          />
        </footer>
      </div>
    </div>
  )
}
