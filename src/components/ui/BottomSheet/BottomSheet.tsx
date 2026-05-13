import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BottomSheetProps } from './BottomSheet.types'

export const BottomSheet: React.FC<BottomSheetProps> = ({ open, onClose, children, title }) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

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
            className="fixed inset-0 bg-black/45 z-40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={title ?? 'Painel'}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_: unknown, info: { offset: { y: number } }) => {
              if (info.offset.y > 80) onClose()
            }}
            className={[
              'fixed bottom-0 left-0 right-0 z-50 bg-qe-white rounded-t-qe-lg',
              'max-h-[90vh] overflow-y-auto',
              'md:left-1/2 md:-translate-x-1/2 md:w-[480px] md:rounded-qe-lg md:bottom-auto md:top-1/2 md:-translate-y-1/2',
            ].join(' ')}
          >
            <div className="w-9 h-1 bg-qe-gray-200 rounded-full mx-auto mt-3 mb-5" aria-hidden="true" />
            {title && (
              <div className="px-5 pb-3 text-[17px] font-bold text-qe-gray-900">{title}</div>
            )}
            <div className="px-5 pb-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
