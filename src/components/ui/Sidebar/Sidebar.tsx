import * as React from 'react'
import boneco from '@/assets/queroExtra-boneco.png'
import type { SidebarProps } from './Sidebar.types'

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  activeItem,
  onChange,
  header,
  footer,
  role,
}) => {
  return (
    <aside
      className="hidden lg:flex flex-col w-60 shrink-0 bg-qe-white border-r border-qe-gray-200 sticky top-0 h-screen overflow-y-auto z-20"
      aria-label="Navegação lateral"
    >
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-qe-gray-100">
        {header ?? (
          <>
            <img src={boneco} alt="" className="h-8 w-auto shrink-0" aria-hidden="true" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[15px] font-bold text-qe-gray-900 tracking-tight leading-none">
                QueroExtra
              </span>
              {role && (
                <span className="text-[10px] font-bold text-qe-gray-400 uppercase tracking-[1.5px] leading-none">
                  {role === 'empresa' ? 'Empresa' : 'Freelancer'}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Itens de navegação */}
      <nav className="flex-1 p-3 space-y-0.5" aria-label="Menu principal">
        {items.map((item) => {
          const isActive = activeItem === item.value
          return (
            <div key={item.value} className="relative">
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-qe-yellow rounded-r-full"
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                onClick={() => onChange(item.value)}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'w-full flex items-center gap-3 pl-5 pr-3 py-2.5 rounded-qe-md transition-colors text-left',
                  isActive
                    ? 'bg-qe-yellow-subtle text-qe-gray-900 font-semibold'
                    : 'text-qe-gray-500 hover:bg-qe-gray-100 hover:text-qe-gray-700 font-medium',
                ].join(' ')}
              >
                <span className="flex items-center shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="text-[14px] leading-none">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="ml-auto text-[11px] font-bold bg-qe-error text-qe-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            </div>
          )
        })}
      </nav>

      {/* Rodapé opcional */}
      {footer && (
        <div className="p-3 border-t border-qe-gray-100">
          {footer}
        </div>
      )}
    </aside>
  )
}
