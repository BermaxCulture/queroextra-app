export const EMPRESA_AREAS = [
  'Food Service',
  'Eventos',
  'Segurança',
  'Limpeza',
  'Logística',
  'Outro',
] as const

export type EmpresaArea = (typeof EMPRESA_AREAS)[number]
