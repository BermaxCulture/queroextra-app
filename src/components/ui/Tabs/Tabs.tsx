import * as React from 'react'
import { motion } from 'framer-motion'
import type { TabsProps } from './Tabs.types'

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => (
  <div
    className="flex border-b border-qe-gray-200"
    role="tablist"
    aria-label="Abas de navegação"
  >
    {tabs.map((tab) => {
      const isActive = activeTab === tab.value
      return (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={isActive}
          aria-controls={`tabpanel-${tab.value}`}
          onClick={() => onChange(tab.value)}
          className={[
            'flex-1 text-center px-2 py-3 text-[14px] cursor-pointer transition-colors relative top-px',
            'border-b-[2.5px] font-sans',
            isActive
              ? 'text-qe-gray-900 font-bold border-transparent'
              : 'text-qe-gray-400 font-normal border-transparent',
          ].join(' ')}
        >
          {isActive && (
            <motion.span
              layoutId="tab-underline"
              className="absolute bottom-[-1px] left-0 right-0 h-[2.5px] bg-qe-yellow rounded-full"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          {tab.label}
        </button>
      )
    })}
  </div>
)
