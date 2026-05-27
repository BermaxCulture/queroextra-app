import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import {
  BottomNav,
  TopBar,
  Button,
  Sidebar,
} from '@/components/ui'
import type { SidebarItem } from '@/components/ui'
import { Compass, Briefcase, Wallet, User } from 'lucide-react'
import VagasExplorarPage from './VagasExplorarPage'
import VagaDetalhesPage from './VagaDetalhesPage'
import MeusExtrasPage from './MeusExtrasPage'
import PerfilPage from './PerfilPage'
import EmpresaPerfilPage from './EmpresaPerfilPage'
import FreelancerCheckinPage from './FreelancerCheckinPage'

const freelancerSidebarItems: SidebarItem[] = [
  { value: 'explorar', label: 'Explorar', icon: <Compass size={20} /> },
  { value: 'extras', label: 'Meus Extras', icon: <Briefcase size={20} /> },
  { value: 'carteira', label: 'Carteira', icon: <Wallet size={20} /> },
  { value: 'perfil', label: 'Perfil', icon: <User size={20} /> },
]

// ==========================================
// ABA: CARTEIRA (MOCK PREMIUM)
// ==========================================
function CarteiraPage() {
  return (
    <div>
      <TopBar variant="main" title="Minha Carteira" />
      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        <h1 className="text-h1 font-bold text-qe-gray-900 mb-2">Carteira</h1>

        {/* Card de Saldo */}
        <div className="bg-qe-navy text-white rounded-qe-lg p-6 space-y-4">
          <div>
            <div className="text-[11px] text-white/50 uppercase tracking-[0.5px] font-bold">Saldo Disponível</div>
            <div className="text-[32px] font-bold mt-1">R$ 0,00</div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <div className="text-[11px] text-white/40 uppercase tracking-[0.5px]">A Receber</div>
              <div className="text-[16px] font-bold mt-0.5">R$ 0,00</div>
            </div>
            <div>
              <div className="text-[11px] text-white/40 uppercase tracking-[0.5px]">Total Pago</div>
              <div className="text-[16px] font-bold mt-0.5">R$ 0,00</div>
            </div>
          </div>
        </div>

        {/* Integração de Pagamento */}
        <div className="bg-white rounded-qe-md border border-qe-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-qe-yellow-subtle rounded-full flex items-center justify-center text-qe-yellow-text">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-qe-gray-900">Recebimento Instantâneo</h3>
              <p className="text-[12px] text-qe-gray-400 mt-0.5">Configure sua conta para receber em até 24h.</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full">
            Configurar Conta de Repasse
          </Button>
        </div>
      </main>
    </div>
  )
}


// ==========================================
// COMPONENTE PRINCIPAL: EXTRAS HOME
// ==========================================
export default function ExtrasHome() {
  const location = useLocation()
  const navigate = useNavigate()

  const getActiveTab = () => {
    const path = location.pathname
    if (path.includes('/extras/explorar')) return 'explorar'
    if (path.includes('/extras/extras')) return 'extras'
    if (path.includes('/extras/carteira')) return 'carteira'
    if (path.includes('/extras/perfil')) return 'perfil'
    return 'explorar'
  }

  const handleTabChange = (tab: string) => {
    navigate(`/extras/${tab}`)
  }

  const showBottomNav =
    !location.pathname.includes('/extras/vaga/') &&
    !location.pathname.includes('/extras/checkin/') &&
    !location.pathname.includes('/extras/freelancer/')

  return (
    <div className="min-h-screen bg-qe-bg-page lg:flex">
      {/* Sidebar — visível apenas no desktop (≥1024px) */}
      <Sidebar
        items={freelancerSidebarItems}
        activeItem={getActiveTab()}
        onChange={handleTabChange}
        role="freelancer"
      />

      {/* Conteúdo principal */}
      <div className="flex-1 min-w-0">
        <Routes>
          <Route path="/" element={<Navigate to="explorar" replace />} />
          <Route path="explorar" element={<VagasExplorarPage />} />
          <Route path="vaga/:id" element={<VagaDetalhesPage />} />
          <Route path="empresa/:companyId" element={<EmpresaPerfilPage />} />
          <Route path="extras" element={<MeusExtrasPage />} />
          <Route path="checkin/:applicationId" element={<FreelancerCheckinPage />} />
          <Route path="carteira" element={<CarteiraPage />} />
          <Route path="perfil" element={<PerfilPage />} />
          <Route path="freelancer/:id" element={<PerfilPage />} />
          <Route path="*" element={<Navigate to="explorar" replace />} />
        </Routes>
      </div>

      {/* BottomNav — visível apenas no mobile (<1024px) */}
      {showBottomNav && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-10 lg:hidden">
          <BottomNav
            variant="freelancer"
            activeTab={getActiveTab()}
            onChange={handleTabChange}
          />
        </div>
      )}
    </div>
  )
}
