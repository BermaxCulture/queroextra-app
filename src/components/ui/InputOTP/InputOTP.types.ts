export interface InputOTPProps {
  length?: number
  onComplete?: (code: string) => void
  onChange?: (code: string) => void
  disabled?: boolean
  autoFocus?: boolean
}
