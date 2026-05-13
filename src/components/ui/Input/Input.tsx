import * as React from 'react'
import type { InputProps } from './Input.types'

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      icon,
      variant = 'default',
      inputState,
      className,
      id,
      ...props
    },
    ref
  ) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const inputId = id ?? React.useId()
    const helperTextId = `${inputId}-helper`
    const errorId = `${inputId}-error`

    const state = errorMessage ? 'error' : inputState

    const borderClass =
      state === 'error'
        ? 'border-qe-error focus:border-qe-error focus:shadow-[0_0_0_3px_rgba(217,48,37,0.10)]'
        : state === 'success'
        ? 'border-qe-success focus:border-qe-success'
        : 'border-qe-gray-200 focus:border-qe-yellow focus:shadow-[0_0_0_3px_rgba(245,192,0,0.15)]'

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-semibold text-qe-gray-700"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3.5 text-qe-gray-400 pointer-events-none flex items-center" aria-hidden="true">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full h-[50px] bg-qe-white border-[1.5px] rounded-qe-sm font-sans text-[16px] text-qe-gray-900',
              'placeholder:text-qe-gray-400 transition-all outline-none appearance-none',
              icon ? 'pl-11 pr-3.5' : 'px-3.5',
              variant === 'select'
                ? "appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_14px_center] pr-10"
                : '',
              borderClass,
              className ?? '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-describedby={
              errorMessage ? errorId : helperText ? helperTextId : undefined
            }
            aria-invalid={state === 'error'}
            {...props}
          />
        </div>
        {helperText && !errorMessage && (
          <span id={helperTextId} className="text-[12px] text-qe-gray-500">
            {helperText}
          </span>
        )}
        {errorMessage && (
          <span
            id={errorId}
            className="text-[12px] text-qe-error flex items-center gap-1"
            role="alert"
            aria-live="polite"
          >
            {errorMessage}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
