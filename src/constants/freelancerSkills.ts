export const FREELANCER_HABILIDADES = [
  'Eventos',
  'Limpeza',
  'Carga e Descarga',
  'Garçom/Garçonete',
  'Recepcionista',
  'Cozinha',
] as const

export type FreelancerHabilidade = (typeof FREELANCER_HABILIDADES)[number]
