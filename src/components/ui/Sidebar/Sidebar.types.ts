import type * as React from 'react'

export interface SidebarItem {
  value: string
  label: string
  icon: React.ReactNode
  badge?: number
}

export interface SidebarProps {
  items: SidebarItem[]
  activeItem: string
  onChange: (value: string) => void
  header?: React.ReactNode
  footer?: React.ReactNode
}
