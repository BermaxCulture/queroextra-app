import * as React from 'react'
import { ArrowLeft, Search, Bell, UserCircle } from 'lucide-react'
import type { TopBarProps } from './TopBar.types'

export const TopBar: React.FC<TopBarProps> = ({
  variant = 'main',
  title,
  onBack,
  actions,
  notificationCount = 0,
  onSearch,
  onNotification,
  onProfile,
}) => {
  if (variant === 'inner') {
    return (
      <header className="h-14 flex items-center justify-between px-4 bg-qe-white border-b border-qe-gray-100">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="w-9 h-9 flex items-center justify-center text-qe-gray-700 cursor-pointer"
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <span className="text-[15px] font-semibold text-qe-gray-900 absolute left-1/2 -translate-x-1/2">
          {title}
        </span>
        <div className="flex items-center">{actions}</div>
      </header>
    )
  }

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-qe-white border-b border-qe-gray-100">
      <span className="text-[18px] font-bold text-qe-gray-900 tracking-[-0.5px] font-sans">
        Quero<span className="text-qe-yellow">Extra</span>
      </span>
      <div className="flex gap-1 items-center">
        {onSearch && (
          <button
            type="button"
            onClick={onSearch}
            aria-label="Buscar"
            className="w-10 h-10 flex items-center justify-center rounded-qe-sm text-qe-gray-700 hover:bg-qe-gray-100 cursor-pointer transition-colors"
          >
            <Search size={22} aria-hidden="true" />
          </button>
        )}
        {onNotification && (
          <button
            type="button"
            onClick={onNotification}
            aria-label={`Notificações${notificationCount ? ` (${notificationCount})` : ''}`}
            className="w-10 h-10 flex items-center justify-center rounded-qe-sm text-qe-gray-700 hover:bg-qe-gray-100 cursor-pointer transition-colors relative"
          >
            <Bell size={22} aria-hidden="true" />
            {notificationCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-qe-error rounded-full border-2 border-white" aria-hidden="true" />
            )}
          </button>
        )}
        {onProfile && (
          <button
            type="button"
            onClick={onProfile}
            aria-label="Perfil"
            className="w-10 h-10 flex items-center justify-center rounded-qe-sm text-qe-gray-700 hover:bg-qe-gray-100 cursor-pointer transition-colors"
          >
            <UserCircle size={22} aria-hidden="true" />
          </button>
        )}
        {actions}
      </div>
    </header>
  )
}
