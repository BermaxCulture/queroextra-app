import * as React from 'react'
import { Check } from 'lucide-react'
import type { AvatarProps } from './Avatar.types'

const sizeMap = {
  xs: { outer: 'w-7 h-7', text: 'text-[10px]', badge: 'w-3.5 h-3.5', icon: 8 },
  sm: { outer: 'w-9 h-9', text: 'text-[13px]', badge: 'w-4 h-4', icon: 9 },
  md: { outer: 'w-11 h-11', text: 'text-[16px]', badge: 'w-[18px] h-[18px]', icon: 10 },
  lg: { outer: 'w-14 h-14', text: 'text-[20px]', badge: 'w-5 h-5', icon: 11 },
  xl: { outer: 'w-20 h-20', text: 'text-[28px]', badge: 'w-6 h-6', icon: 13 },
}

const initials = (name?: string) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  verified = false,
}) => {
  const s = sizeMap[size]
  const [imgError, setImgError] = React.useState(false)

  return (
    <span className="relative inline-flex">
      <span
        className={[
          s.outer,
          'rounded-full overflow-hidden flex items-center justify-center font-bold font-sans flex-shrink-0',
          !src || imgError ? 'bg-qe-yellow-subtle text-qe-yellow-text' : '',
        ].join(' ')}
        role={!src || imgError ? 'img' : undefined}
        aria-label={alt ?? name ?? 'Avatar'}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={alt ?? name ?? 'Avatar'}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className={s.text} aria-hidden="true">
            {initials(name)}
          </span>
        )}
      </span>
      {verified && (
        <span
          className={[
            s.badge,
            'absolute bottom-0 right-0 bg-qe-yellow rounded-full flex items-center justify-center border-2 border-white',
          ].join(' ')}
          aria-label="Verificado"
        >
          <Check size={s.icon} className="text-qe-black" strokeWidth={3} aria-hidden="true" />
        </span>
      )}
    </span>
  )
}
