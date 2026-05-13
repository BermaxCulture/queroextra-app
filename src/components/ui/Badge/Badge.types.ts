export interface BadgeProps {
  variant: 'urgent' | 'pending' | 'confirmed' | 'warning' | 'info' | 'category'
  children: React.ReactNode
  icon?: React.ReactNode
}
