export interface ToastMessage {
  id: string
  variant: 'success' | 'error' | 'info'
  message: string
}

export interface ToastProps {
  variant: 'success' | 'error' | 'info'
  message: string
  onClose?: () => void
}
