export function stripCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}

export function formatCnpj(value: string): string {
  const digits = stripCnpj(value).slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

export function isValidCnpj(cnpj: string): boolean {
  const digits = stripCnpj(cnpj)
  if (digits.length !== 14) return false
  if (/^(\d)\1{13}$/.test(digits)) return false

  const calcDigit = (base: string, weights: number[]) => {
    const sum = base.split('').reduce((acc, d, i) => acc + Number(d) * weights[i], 0)
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  const first = calcDigit(digits.slice(0, 12), firstWeights)
  if (first !== Number(digits[12])) return false

  const second = calcDigit(digits.slice(0, 13), secondWeights)
  return second === Number(digits[13])
}
