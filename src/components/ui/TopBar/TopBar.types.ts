export interface TopBarProps {
  variant?: 'main' | 'inner'
  title?: string
  onBack?: () => void
  actions?: React.ReactNode
  notificationCount?: number
  onSearch?: () => void
  onNotification?: () => void
  onProfile?: () => void
}
