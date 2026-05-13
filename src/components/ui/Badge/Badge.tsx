import * as React from 'react'
import type { BadgeProps } from './Badge.types'

const variantClasses: Record<BadgeProps['variant'], string> = {
  urgent: 'bg-qe-error-bg text-qe-error',
  pending: 'bg-[#F0F0F0] text-[#666666]',
  confirmed: 'bg-qe-success-bg text-[#1A7A47]',
  warning: 'bg-qe-warning-bg text-qe-warning',
  info: 'bg-[#E3F2FD] text-[#1565C0]',
  category: 'bg-qe-gray-100 text-qe-gray-700',
}

export const Badge: React.FC<BadgeProps> = ({ variant, children, icon }) => (
  <span
    className={[
      'inline-flex items-center gap-1 px-2.5 py-[3px] rounded-qe-pill',
      'text-[11px] font-bold tracking-[0.3px] uppercase font-sans',
      variantClasses[variant],
    ].join(' ')}
  >
    {icon && <span className="flex items-center" aria-hidden="true">{icon}</span>}
    {children}
  </span>
)
