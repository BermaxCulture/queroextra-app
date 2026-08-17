import {
  Wine, Martini, ChefHat, DoorOpen, PhoneCall, ShieldCheck, Sparkles, MoreHorizontal,
  type LucideIcon,
} from 'lucide-react'

export const JOB_CATEGORIES = [
  'Garçom / Garçonete', 'Bartender', 'Auxiliar de Cozinha',
  'Hostess', 'Recepcionista', 'Segurança', 'Limpeza', 'Outros',
]

// Ícone por categoria — usado no grid de filtro estilo iFood da tela inicial (QUER-67)
export const JOB_CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Garçom / Garçonete': Wine,
  'Bartender': Martini,
  'Auxiliar de Cozinha': ChefHat,
  'Hostess': DoorOpen,
  'Recepcionista': PhoneCall,
  'Segurança': ShieldCheck,
  'Limpeza': Sparkles,
  'Outros': MoreHorizontal,
}

export const JOB_TAGS = ['INÍCIO IMEDIATO', 'TURNO DA NOITE', 'FIM DE SEMANA']

export const BRAZIL_STATES = [
  { label: 'Acre', value: 'AC' },
  { label: 'Alagoas', value: 'AL' },
  { label: 'Amapá', value: 'AP' },
  { label: 'Amazonas', value: 'AM' },
  { label: 'Bahia', value: 'BA' },
  { label: 'Ceará', value: 'CE' },
  { label: 'Distrito Federal', value: 'DF' },
  { label: 'Espírito Santo', value: 'ES' },
  { label: 'Goiás', value: 'GO' },
  { label: 'Maranhão', value: 'MA' },
  { label: 'Mato Grosso', value: 'MT' },
  { label: 'Mato Grosso do Sul', value: 'MS' },
  { label: 'Minas Gerais', value: 'MG' },
  { label: 'Pará', value: 'PA' },
  { label: 'Paraíba', value: 'PB' },
  { label: 'Paraná', value: 'PR' },
  { label: 'Pernambuco', value: 'PE' },
  { label: 'Piauí', value: 'PI' },
  { label: 'Rio de Janeiro', value: 'RJ' },
  { label: 'Rio Grande do Norte', value: 'RN' },
  { label: 'Rio Grande do Sul', value: 'RS' },
  { label: 'Rondônia', value: 'RO' },
  { label: 'Roraima', value: 'RR' },
  { label: 'Santa Catarina', value: 'SC' },
  { label: 'São Paulo', value: 'SP' },
  { label: 'Sergipe', value: 'SE' },
  { label: 'Tocantins', value: 'TO' },
]

export const STATUS_LABELS: Record<string, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
}
