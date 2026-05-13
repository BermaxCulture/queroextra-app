export interface TabItem {
  label: string
  value: string
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (value: string) => void
}
