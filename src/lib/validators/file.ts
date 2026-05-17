export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export const ACCEPTED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const

export const ACCEPTED_DOCUMENT_EXTENSIONS = '.pdf,.jpg,.jpeg,.png'

export function validateDocumentFile(file: File): string | null {
  if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type as (typeof ACCEPTED_DOCUMENT_TYPES)[number])) {
    return 'Formato inválido. Use PDF, JPG ou PNG.'
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'Arquivo muito grande. O limite é 10MB por arquivo.'
  }
  return null
}

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Selecione uma imagem válida (JPG ou PNG).'
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'Imagem muito grande. O limite é 10MB.'
  }
  return null
}
