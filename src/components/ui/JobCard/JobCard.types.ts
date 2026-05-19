export interface JobCardProps {
  category: string
  title: string
  companyName?: string
  location: string
  distance?: string
  date: string
  time: string
  value: number
  unit?: string
  isUrgent?: boolean
  tags?: string[]
  onApply?: () => void
}

