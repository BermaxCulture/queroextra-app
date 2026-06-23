import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { ChevronDown, Check, Search } from 'lucide-react'
import type { SelectProps } from './Select.types'
import { BottomSheet } from '../BottomSheet'

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768
  )
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

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
    const isMobile = useIsMobile()
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({})

    const containerRef = React.useRef<HTMLDivElement>(null)
    const buttonRef    = React.useRef<HTMLButtonElement>(null)
    const listRef      = React.useRef<HTMLUListElement>(null)
    const searchRef    = React.useRef<HTMLInputElement>(null)

    const inputId      = id ?? React.useId()
    const listId       = `${inputId}-list`
    const errorId      = `${inputId}-error`
    const helperTextId = `${inputId}-helper`

    const selected = options.find((opt) => opt.value === value)
    const hasError = !!errorMessage

    // Filtra opções — em mobile sempre mostra busca
    const showSearch = searchable || isMobile
    const filteredOptions = showSearch && search
      ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
      : options

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
        // Só auto-foca no desktop — no mobile o usuário toca no campo para abrir o teclado
        if (!isMobile) setTimeout(() => searchRef.current?.focus(), 50)
      }
      setOpen((prev) => !prev)
    }

    const handleClose = () => {
      setOpen(false)
      setSearch('')
      onBlur?.()
    }

    React.useEffect(() => {
      if (!open || isMobile) return
      const handler = (e: MouseEvent) => {
        const target = e.target as Node
        const inContainer = containerRef.current?.contains(target)
        const inDropdown  = listRef.current?.contains(target)
        if (!inContainer && !inDropdown) handleClose()
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [open, isMobile])

    React.useEffect(() => {
      if (!open || isMobile) return
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }, [open, isMobile, updatePosition])

    const handleSelect = (optValue: string) => {
      onChange?.(optValue)
      handleClose()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle() }
    }

    const borderClass = hasError
      ? 'border-qe-error shadow-[0_0_0_3px_rgba(217,48,37,0.10)]'
      : open && !isMobile
      ? 'border-qe-yellow shadow-[0_0_0_3px_rgba(245,192,0,0.15)]'
      : 'border-qe-gray-200 hover:border-qe-gray-300'

    // ── Lista de opções (reutilizada em desktop e mobile) ────────────────────
    const OptionsList = (
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={label}
        className="py-1"
      >
        {filteredOptions.length === 0 ? (
          <li className="px-4 py-3 text-[14px] text-qe-gray-400 text-center">
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
                'flex items-center justify-between px-5 py-3.5 cursor-pointer text-[15px] transition-colors select-none',
                isActive
                  ? 'bg-qe-yellow-subtle text-qe-gray-900 font-semibold'
                  : 'text-qe-gray-700 active:bg-qe-gray-50',
              ].join(' ')}
            >
              <span>{opt.label}</span>
              {isActive && <Check size={16} className="text-qe-yellow-text shrink-0" />}
            </li>
          )
        })}
      </ul>
    )

    // ── Campo de busca ───────────────────────────────────────────────────────
    const SearchInput = (
      <div className="px-5 py-3 border-b border-qe-gray-100">
        <div className="flex items-center gap-2 bg-qe-gray-50 rounded-qe-sm px-3 h-11">
          <Search size={15} className="text-qe-gray-400 shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Buscar..."
            className="flex-1 bg-transparent text-[15px] text-qe-gray-900 outline-none placeholder:text-qe-gray-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-qe-gray-400 hover:text-qe-gray-600"
            >
              <Check size={13} className="rotate-45" />
            </button>
          )}
        </div>
      </div>
    )

    // ── Trigger button (compartilhado) ───────────────────────────────────────
    const TriggerButton = (
      <button
        ref={buttonRef}
        type="button"
        id={inputId}
        name={name}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open && !isMobile ? listId : undefined}
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
            open && !isMobile ? 'rotate-180' : '',
          ].join(' ')}
          aria-hidden="true"
        />
      </button>
    )

    return (
      <div ref={ref} className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-semibold text-qe-gray-700">
            {label}
          </label>
        )}

        <div ref={containerRef} className="relative">
          {TriggerButton}
        </div>

        {/* ── Mobile: BottomSheet ─────────────────────────────────────────── */}
        {isMobile && (
          <BottomSheet open={open} onClose={handleClose} title={label}>
            {/* -mx-5 cancela o px-5 do BottomSheet para search + lista ficarem edge-to-edge */}
            <div className="-mx-5">
              {SearchInput}
              <div className="overflow-y-auto max-h-[55vh]">
                {OptionsList}
              </div>
            </div>
          </BottomSheet>
        )}

        {/* ── Desktop: dropdown portal ────────────────────────────────────── */}
        {!isMobile && open && ReactDOM.createPortal(
          <div
            style={dropdownStyle}
            className="bg-qe-white border border-qe-gray-200 rounded-qe-md shadow-qe-md overflow-hidden"
          >
            {showSearch && SearchInput}
            <div className="max-h-52 overflow-y-auto">
              {OptionsList}
            </div>
          </div>,
          document.body
        )}

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
