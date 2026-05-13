export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  errorMessage?: string
  icon?: React.ReactNode
  variant?: 'default' | 'select'
  inputState?: 'default' | 'error' | 'success'
}
