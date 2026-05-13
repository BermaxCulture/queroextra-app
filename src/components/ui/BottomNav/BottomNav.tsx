import * as React from 'react'
import { Compass, Briefcase, Wallet, User, LayoutGrid } from 'lucide-react'
import type { BottomNavProps, BottomNavItem } from './BottomNav.types'

const freelancerItems: BottomNavItem[] = [
  { value: 'explorar', label: 'Explorar', icon: <Compass size={22} /> },
  { value: 'extras', label: 'Meus Extras', icon: <Briefcase size={22} /> },
  { value: 'carteira', label: 'Carteira', icon: <Wallet size={22} /> },
  { value: 'perfil', label: 'Perfil', icon: <User size={22} /> },
]

const empresaItems: BottomNavItem[] = [
  { value: 'explorar', label: 'Explorar', icon: <Compass size={22} /> },
  { value: 'gestao', label: 'Gestão', icon: <LayoutGrid size={22} /> },
  { value: 'carteira', label: 'Carteira', icon: <Wallet size={22} /> },
  { value: 'perfil', label: 'Perfil', icon: <User size={22} /> },
]

export const BottomNav: React.FC<BottomNavProps> = ({
  variant = 'freelancer',
  activeTab,
  onChange,
  notifications = {},
}) => {
  const items = variant === 'empresa' ? empresaItems : freelancerItems

  return (
    <nav
      className="bg-qe-white border-t border-qe-gray-200 flex h-16"
      aria-label="Navegação principal"
    >
      {items.map((item) => {
        const isActive = activeTab === item.value
        const hasNotification = notifications[item.value]

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'flex-1 flex flex-col items-center justify-center gap-[3px] cursor-pointer',
              'transition-colors relative min-h-touch',
              isActive ? 'text-qe-black' : 'text-qe-gray-400',
            ].join(' ')}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-[2.5px] bg-qe-yellow rounded-b-sm" aria-hidden="true" />
            )}
            <span className="flex items-center" aria-hidden="true">{item.icon}</span>
            <span className="text-[10px] font-medium tracking-[0.2px]">{item.label}</span>
            {hasNotification && (
              <span
                className="absolute top-2 right-[calc(50%-18px)] w-2 h-2 bg-qe-error rounded-full border-2 border-white"
                aria-label="Notificação"
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
