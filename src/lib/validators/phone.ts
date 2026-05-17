export function stripPhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function formatPhone(value: string): string {
  if (!value) return ''
  let digits = stripPhone(value)
  digits = digits.replace(/(\d{2})(\d)/, '($1) $2')
  digits = digits.replace(/(\d{5})(\d)/, '$1-$2')
  return digits.substring(0, 15)
}

export function isValidWhatsAppPhone(phone: string): boolean {
  const digits = stripPhone(phone)
  return digits.length === 11 && digits[2] === '9'
}
