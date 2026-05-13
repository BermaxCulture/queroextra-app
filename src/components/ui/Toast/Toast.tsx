import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import type { ToastProps, ToastMessage } from './Toast.types'

const variantConfig = {
  success: { bg: 'bg-[#0F5132]', icon: CheckCircle },
  error: { bg: 'bg-[#7A1919]', icon: XCircle },
  info: { bg: 'bg-qe-navy', icon: Info },
}

export const Toast: React.FC<ToastProps> = ({ variant, message, onClose }) => {
  const { bg, icon: Icon } = variantConfig[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={[
        'flex items-center gap-3 px-4 py-3.5 rounded-qe-md text-white font-sans',
        'text-[14px] font-medium shadow-qe-lg min-w-[280px] max-w-[360px]',
        bg,
      ].join(' ')}
      role="alert"
      aria-live="polite"
    >
      <Icon size={20} className="flex-shrink-0" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar notificação"
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </motion.div>
  )
}

// Toast context and hook
interface ToastContextValue {
  showToast: (message: string, variant?: ToastMessage['variant']) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([])

  const showToast = React.useCallback(
    (message: string, variant: ToastMessage['variant'] = 'info') => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, message, variant }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 3000)
    },
    []
  )

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none"
        aria-live="polite"
        aria-label="Notificações"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <Toast
                variant={t.variant}
                message={t.message}
                onClose={() => dismiss(t.id)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
