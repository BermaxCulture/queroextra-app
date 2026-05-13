import * as React from 'react'
import { motion } from 'framer-motion'
import type { ChipProps } from './Chip.types'

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onClick,
  icon,
  variant = 'skill',
  disabled = false,
}) => {
  const skillClass = selected
    ? 'bg-qe-yellow border-qe-yellow text-qe-black font-semibold'
    : 'bg-qe-white border-qe-gray-200 text-qe-gray-700 hover:border-qe-gray-400'

  const filterClass = selected
    ? 'bg-qe-black border-transparent text-qe-white'
    : 'bg-qe-gray-100 border-transparent text-qe-gray-700 hover:bg-qe-gray-200'

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-pressed={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={[
        'inline-flex items-center gap-1.5 px-4 py-2 rounded-qe-pill text-[14px] font-medium',
        'cursor-pointer transition-all border-[1.5px] min-h-[36px] font-sans select-none',
        variant === 'skill' ? skillClass : filterClass,
        disabled ? 'opacity-40 pointer-events-none' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon && <span className="flex items-center" aria-hidden="true">{icon}</span>}
      {label}
    </motion.button>
  )
}
