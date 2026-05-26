import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ModalProps } from './Modal.types'

export const Modal: React.FC<ModalProps> = ({ open, onClose, children, title }) => {
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/45 z-[9998]"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-label={title ?? 'Modal'}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            // translateX/Y via Framer Motion para compor corretamente com scale
            style={{ translateX: '-50%', translateY: '-50%' }}
            className="fixed top-1/2 left-1/2 z-[9999] bg-qe-white rounded-qe-lg w-[520px] max-h-[80vh] overflow-y-auto shadow-qe-lg"
          >
            {title && (
              <div className="px-5 pt-5 pb-3 text-[17px] font-bold text-qe-gray-900 border-b border-qe-gray-100">
                {title}
              </div>
            )}
            <div className={['px-5 pb-6', !title ? 'pt-5' : 'pt-4'].join(' ')}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
