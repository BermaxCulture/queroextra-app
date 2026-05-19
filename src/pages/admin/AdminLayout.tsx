import * as React from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, LogOut } from 'lucide-react'
import { Sidebar, ResponsiveSheet, Button } from '@/components/ui'
import type { SidebarItem } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

const adminItems: SidebarItem[] = [
  { value: '/admin', label: 'Painel', icon: <LayoutDashboard size={20} /> },
  { value: '/admin/empresas-pendentes', label: 'Validar Empresas', icon: <Building2 size={20} /> },
]

const adminHeader = (
  <span className="text-[14px] font-bold text-qe-gray-500 uppercase tracking-widest">
    Admin
  </span>
)

export default function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false)

  const activeItem = location.pathname

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true)
  }

  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false)
    await signOut()
    navigate('/admin/login')
  }

  const adminFooter = (
    <button
      type="button"
      onClick={handleLogoutClick}
      className="w-full flex items-center gap-3 pl-5 pr-3 py-2.5 rounded-qe-md text-qe-error hover:bg-qe-error-bg hover:text-qe-error transition-all text-left font-bold cursor-pointer border-none bg-transparent"
      title="Sair do Painel"
    >
      <LogOut size={20} />
      <span className="text-[14px]">Sair</span>
    </button>
  )

  return (
    <div className="min-h-screen lg:flex flex-col lg:flex-row bg-qe-bg-page font-sans">
      {/* HEADER E NAVEGAÇÃO MOBILE (Visível apenas em telas < 1024px) */}
      <div className="lg:hidden sticky top-0 z-45 bg-white border-b border-qe-gray-200 flex flex-col">
        <header className="h-14 px-4 flex items-center justify-between">
          <span className="text-[16px] font-bold text-qe-gray-900 tracking-tight">
            Quero<span className="text-qe-yellow">Extra</span> <span className="text-[12px] font-bold text-qe-gray-400 uppercase tracking-widest bg-qe-gray-50 border border-qe-gray-100 px-1.5 py-0.5 rounded-qe-xs ml-1.5">Admin</span>
          </span>
          <button
            type="button"
            onClick={handleLogoutClick}
            className="w-9 h-9 flex items-center justify-center rounded-qe-sm text-qe-error hover:bg-qe-error-bg transition-colors cursor-pointer border-none bg-transparent"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </header>

        {/* Menu de Abas Deslizante no Mobile */}
        <nav className="flex border-t border-qe-gray-100 overflow-x-auto scrollbar-none px-2 py-1">
          {adminItems.map((item) => {
            const isActive = activeItem === item.value
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => navigate(item.value)}
                className={[
                  'px-4 py-2.5 text-[13px] font-bold whitespace-nowrap transition-all border-none bg-transparent cursor-pointer',
                  isActive ? 'text-qe-yellow-text border-b-2 border-qe-yellow font-bold' : 'text-qe-gray-400'
                ].join(' ')}
              >
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* SIDEBAR DESKTOP */}
      <Sidebar
        items={adminItems}
        activeItem={activeItem}
        onChange={(path) => navigate(path)}
        header={adminHeader}
        footer={adminFooter}
      />

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 min-w-0 p-4 md:p-8">
        {children}
      </main>

      {/* MODAL DE CONFIRMAÇÃO DE LOGOUT */}
      <ResponsiveSheet
        open={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirmar Saída"
      >
        <div className="pt-2 space-y-4">
          <p className="text-[14px] text-qe-gray-500 leading-relaxed">
            Tem certeza que deseja encerrar a sua sessão no painel administrativo do QueroExtra?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-qe-gray-100 font-sans">
            <Button
              variant="ghost"
              size="sm"
              className="font-bold text-qe-gray-500 hover:text-qe-gray-700"
              onClick={() => setIsLogoutModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-qe-error hover:bg-qe-error-hover text-white font-bold border-none px-5"
              onClick={handleConfirmLogout}
            >
              Sim, Sair
            </Button>
          </div>
        </div>
      </ResponsiveSheet>
    </div>
  )
}

