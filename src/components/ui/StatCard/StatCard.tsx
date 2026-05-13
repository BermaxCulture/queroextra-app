import * as React from 'react'
import type { StatCardProps } from './StatCard.types'

export const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, icon }) => (
  <div className="bg-qe-white rounded-qe-md p-4 border border-qe-gray-200 shadow-qe-sm">
    {icon && (
      <span className="flex items-center text-qe-gray-400 mb-2" aria-hidden="true">
        {icon}
      </span>
    )}
    <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-qe-gray-400 mb-1.5">
      {label}
    </div>
    <div className="text-[28px] font-bold text-qe-gray-900 leading-none">
      {value}
    </div>
    {subtext && (
      <div className="text-[12px] text-qe-gray-400 mt-1">{subtext}</div>
    )}
  </div>
)
