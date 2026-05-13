import * as React from 'react'
import type { InputOTPProps } from './InputOTP.types'

export const InputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
  ({ length = 6, onComplete, onChange, disabled = false, autoFocus = false }, ref) => {
    const [values, setValues] = React.useState<string[]>(Array(length).fill(''))
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

    const focusAt = (index: number) => {
      inputRefs.current[index]?.focus()
    }

    React.useEffect(() => {
      if (autoFocus) focusAt(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoFocus])

    const handleChange = (index: number, rawValue: string) => {
      const digit = rawValue.replace(/\D/g, '').slice(-1)
      const next = [...values]
      next[index] = digit
      setValues(next)
      onChange?.(next.join(''))
      if (digit && index < length - 1) focusAt(index + 1)
      if (next.every((v) => v !== '') && digit) onComplete?.(next.join(''))
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (values[index]) {
          const next = [...values]
          next[index] = ''
          setValues(next)
          onChange?.(next.join(''))
        } else if (index > 0) {
          focusAt(index - 1)
        }
      }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
      const next = [...values]
      pasted.split('').forEach((ch, i) => {
        next[i] = ch
      })
      setValues(next)
      onChange?.(next.join(''))
      if (next.every((v) => v !== '')) onComplete?.(next.join(''))
      const nextEmpty = next.findIndex((v) => !v)
      focusAt(nextEmpty === -1 ? length - 1 : nextEmpty)
    }

    return (
      <div ref={ref} className="flex gap-2" role="group" aria-label="Código OTP">
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={values[i]}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            aria-label={`Dígito ${i + 1} de ${length}`}
            className={[
              'w-12 h-14 text-center text-[22px] font-bold border-[1.5px] rounded-qe-sm font-sans',
              'text-qe-gray-900 bg-qe-white outline-none transition-all',
              'focus:border-qe-yellow focus:shadow-[0_0_0_3px_rgba(245,192,0,0.15)]',
              values[i]
                ? 'border-qe-yellow bg-qe-yellow-subtle text-qe-yellow-text'
                : 'border-qe-gray-200',
              disabled ? 'opacity-40 pointer-events-none' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        ))}
      </div>
    )
  }
)

InputOTP.displayName = 'InputOTP'
