export type BottomNavVariant = 'freelancer' | 'empresa'

export interface BottomNavItem {
  value: string
  label: string
  icon: React.ReactNode
}

export interface BottomNavProps {
  variant?: BottomNavVariant
  activeTab: string
  onChange: (value: string) => void
  notifications?: Record<string, boolean>
}
