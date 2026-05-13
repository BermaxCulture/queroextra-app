export interface ChipProps {
  label: string
  selected?: boolean
  onClick?: () => void
  icon?: React.ReactNode
  variant?: 'skill' | 'filter'
  disabled?: boolean
}
