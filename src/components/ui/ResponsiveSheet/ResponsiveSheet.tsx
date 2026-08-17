import * as React from 'react'
import { BottomSheet } from '../BottomSheet'
import { Modal } from '../Modal'
import type { ModalProps } from '../Modal/Modal.types'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState(
    () => window.matchMedia('(min-width: 1024px)').matches
  )
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

export const ResponsiveSheet: React.FC<ModalProps> = (props) => {
  const isDesktop = useIsDesktop()
  return isDesktop ? <Modal {...props} /> : <BottomSheet {...props} />
}
