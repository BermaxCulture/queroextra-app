export interface TopBarProps {
  variant?: 'main' | 'inner'
  title?: React.ReactNode
  onBack?: () => void
  actions?: React.ReactNode
  notificationCount?: number
  onSearch?: () => void
  onNotification?: () => void
  onProfile?: () => void
}
