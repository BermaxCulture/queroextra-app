import * as React from 'react'

export const ZapGradient: React.FC<{ size?: number }> = ({ size = 16 }) => {
  const id = React.useId().replace(/:/g, '')

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'inline', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={id} x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF8C00" />
          <stop offset="100%" stopColor="#FF2200" />
        </linearGradient>
      </defs>
      <path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        fill={`url(#${id})`}
        stroke={`url(#${id})`}
        strokeWidth="0.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
