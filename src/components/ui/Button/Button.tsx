import * as React from 'react'
import { cva } from 'class-variance-authority'
import { motion } from 'framer-motion'
import type { ButtonProps } from './Button.types'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold font-sans rounded-qe-pill transition-all min-h-touch cursor-pointer border-none select-none',
  {
    variants: {
      variant: {
        primary: 'bg-qe-yellow text-qe-black hover:bg-qe-yellow-hover active:bg-qe-yellow-pressed',
        secondary: 'bg-qe-white text-qe-gray-900 border-[1.5px] border-qe-gray-200 hover:border-qe-gray-400 hover:bg-qe-gray-50',
        ghost: 'bg-transparent text-qe-gray-700 hover:bg-qe-gray-100',
        danger: 'bg-qe-error-bg text-qe-error',
      },
      size: {
        sm: 'text-[13px] min-h-[36px] px-4',
        md: 'text-[15px] px-6',
        lg: 'text-[17px] min-h-[52px] px-8 w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
)

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant,
      size,
      loading = false,
      disabled = false,
      leadingIcon,
      trailingIcon,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref}
        className={[
          buttonVariants({ variant, size }),
          isDisabled ? 'opacity-40 pointer-events-none' : '',
          loading ? 'opacity-70' : '',
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {loading ? <Spinner /> : leadingIcon}
        {children}
        {!loading && trailingIcon}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
