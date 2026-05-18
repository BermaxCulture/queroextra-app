import { formatCpf, isValidCpf, stripCpf } from '@/lib/validators/cpf'
import { formatCnpj, isValidCnpj, stripCnpj } from '@/lib/validators/cnpj'

export function stripCnpjCpf(value: string): string {
  return value.replace(/\D/g, '')
}

export function formatCnpjCpf(value: string): string {
  const digits = stripCnpjCpf(value)
  if (digits.length <= 11) return formatCpf(value)
  return formatCnpj(value)
}

export function isValidCnpjCpf(value: string): boolean {
  const digits = stripCnpjCpf(value)
  if (digits.length === 11) return isValidCpf(value)
  if (digits.length === 14) return isValidCnpj(value)
  return false
}

export function cnpjCpfLabel(value: string): 'CPF' | 'CNPJ' {
  const digits = stripCnpjCpf(value)
  return digits.length > 11 ? 'CNPJ' : 'CPF'
}

export { stripCpf, stripCnpj }
