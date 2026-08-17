export interface AvatarCropModalProps {
  open: boolean
  file: File | null
  onClose: () => void
  onConfirm: (croppedFile: File) => void | Promise<void>
  loading?: boolean
}
