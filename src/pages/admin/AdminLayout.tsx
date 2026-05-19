import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2 } from 'lucide-react'
import { Sidebar } from '@/components/ui'
import type { SidebarItem } from '@/components/ui'

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

  const activeItem = location.pathname

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        items={adminItems}
        activeItem={activeItem}
        onChange={(path) => navigate(path)}
        header={adminHeader}
      />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
