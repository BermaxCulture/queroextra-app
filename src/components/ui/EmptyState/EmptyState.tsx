import * as React from 'react'
import type { EmptyStateProps } from './EmptyState.types'

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center px-6 py-10">
    <span className="text-[48px] text-qe-gray-400 mb-4 flex items-center" aria-hidden="true">
      {icon}
    </span>
    <h3 className="text-[17px] font-bold text-qe-gray-900 mb-2">{title}</h3>
    {description && (
      <p className="text-[14px] text-qe-gray-400 leading-relaxed max-w-[260px] mb-4">
        {description}
      </p>
    )}
    {action && <div className="mt-2">{action}</div>}
  </div>
)
