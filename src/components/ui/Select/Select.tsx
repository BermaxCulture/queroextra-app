import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { ChevronDown, Check, Search } from 'lucide-react'
import type { SelectProps } from './Select.types'

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      onBlur,
      label,
      placeholder = 'Selecione...',
      helperText,
      errorMessage,
      disabled,
      name,
      id,
      searchable = false,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({})

    const containerRef = React.useRef<HTMLDivElement>(null)
    const buttonRef    = React.useRef<HTMLButtonElement>(null)
    const listRef      = React.useRef<HTMLUListElement>(null)
    const searchRef    = React.useRef<HTMLInputElement>(null)

    const inputId     = id ?? React.useId()
    const listId      = `${inputId}-list`
    const errorId     = `${inputId}-error`
    const helperTextId = `${inputId}-helper`

    const selected = options.find((opt) => opt.value === value)
    const hasError = !!errorMessage

    const filteredOptions = searchable && search
      ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
      : options

    // Calcula a posição do dropdown com base no botão trigger
    const updatePosition = React.useCallback(() => {
      if (!buttonRef.current) return
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: 'fixed',
        top:   rect.bottom + 4,
        left:  rect.left,
        width: rect.width,
        zIndex: 9999,
      })
    }, [])

    const handleToggle = () => {
      if (disabled) return
      if (!open) {
        updatePosition()
        setSearch('')
        setTimeout(() => searchRef.current?.focus(), 50)
      }
      setOpen((prev) => !prev)
    }

    // Fecha ao clicar fora (considera o portal do dropdown)
    React.useEffect(() => {
      if (!open) return
      const handler = (e: MouseEvent) => {
        const target = e.target as Node
        const inContainer = containerRef.current?.contains(target)
        const inDropdown  = listRef.current?.contains(target)
        if (!inContainer && !inDropdown) {
          setOpen(false)
          onBlur?.()
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [open, onBlur])

    // Reposiciona ao rolar ou redimensionar
    React.useEffect(() => {
      if (!open) return
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }, [open, updatePosition])

    const handleSelect = (optValue: string) => {
      onChange?.(optValue)
      setOpen(false)
      onBlur?.()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); onBlur?.() }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle() }
    }

    const borderClass = hasError
      ? 'border-qe-error shadow-[0_0_0_3px_rgba(217,48,37,0.10)]'
      : open
      ? 'border-qe-yellow shadow-[0_0_0_3px_rgba(245,192,0,0.15)]'
      : 'border-qe-gray-200 hover:border-qe-gray-300'

    const dropdown = (
      <div
        style={dropdownStyle}
        className="bg-qe-white border border-qe-gray-200 rounded-qe-md shadow-qe-md overflow-hidden"
      >
        {searchable && (
          <div className="px-2 pt-2 pb-1 border-b border-qe-gray-100">
            <div className="flex items-center gap-2 bg-qe-gray-50 rounded-qe-sm px-2.5 h-9">
              <Search size={14} className="text-qe-gray-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder="Buscar..."
                className="flex-1 bg-transparent text-[14px] text-qe-gray-900 outline-none placeholder:text-qe-gray-400"
              />
            </div>
          </div>
        )}
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          className="max-h-52 overflow-y-auto py-1"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-3.5 py-2.5 text-[14px] text-qe-gray-400 text-center">
              Nenhuma opção encontrada
            </li>
          ) : filteredOptions.map((opt) => {
            const isActive = opt.value === value
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isActive}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(opt.value)}
                className={[
                  'flex items-center justify-between px-3.5 py-2.5 cursor-pointer text-[15px] font-sans transition-colors select-none',
                  isActive
                    ? 'bg-qe-yellow-subtle text-qe-gray-900 font-semibold'
                    : 'text-qe-gray-700 hover:bg-qe-gray-50',
                ].join(' ')}
              >
                <span>{opt.label}</span>
                {isActive && <Check size={15} className="text-qe-yellow-text shrink-0" />}
              </li>
            )
          })}
        </ul>
      </div>
    )

    return (
      <div ref={ref} className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-semibold text-qe-gray-700">
            {label}
          </label>
        )}

        <div ref={containerRef} className="relative">
          <button
            ref={buttonRef}
            type="button"
            id={inputId}
            name={name}
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={open ? listId : undefined}
            aria-describedby={hasError ? errorId : helperText ? helperTextId : undefined}
            aria-invalid={hasError}
            disabled={disabled}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            className={[
              'w-full h-[50px] bg-qe-white border-[1.5px] rounded-qe-sm font-sans text-[16px] text-left',
              'pl-3.5 pr-10 transition-all outline-none flex items-center gap-2',
              selected ? 'text-qe-gray-900' : 'text-qe-gray-400',
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              borderClass,
            ].filter(Boolean).join(' ')}
          >
            <span className="flex-1 truncate">{selected ? selected.label : placeholder}</span>
            <ChevronDown
              size={18}
              className={[
                'absolute right-3.5 text-qe-gray-400 transition-transform duration-200 pointer-events-none',
                open ? 'rotate-180' : '',
              ].join(' ')}
              aria-hidden="true"
            />
          </button>
        </div>

        {open && ReactDOM.createPortal(dropdown, document.body)}

        {helperText && !errorMessage && (
          <span id={helperTextId} className="text-[12px] text-qe-gray-500">{helperText}</span>
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

Select.displayName = 'Select'
