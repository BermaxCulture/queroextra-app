import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import {
  BottomNav,
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
import OnboardingModal from './OnboardingPage'
import { CarteirePage } from './CarteirePage'

const freelancerSidebarItems: SidebarItem[] = [
  { value: 'explorar', label: 'Explorar', icon: <Compass size={20} /> },
  { value: 'extras', label: 'Meus Extras', icon: <Briefcase size={20} /> },
  { value: 'carteira', label: 'Carteira', icon: <Wallet size={20} /> },
  { value: 'perfil', label: 'Perfil', icon: <User size={20} /> },
]



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

      {/* Modal de onboarding — aparece sobre o conteúdo se status for null */}
      <OnboardingModal />

      {/* Conteúdo principal */}
      <div className="flex-1 min-w-0">
        <Routes>
          <Route path="/" element={<Navigate to="explorar" replace />} />
          <Route path="explorar" element={<VagasExplorarPage />} />
          <Route path="vaga/:id" element={<VagaDetalhesPage />} />
          <Route path="empresa/:companyId" element={<EmpresaPerfilPage />} />
          <Route path="extras" element={<MeusExtrasPage />} />
          <Route path="checkin/:applicationId" element={<FreelancerCheckinPage />} />
          <Route path="carteira" element={<CarteirePage />} />
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
