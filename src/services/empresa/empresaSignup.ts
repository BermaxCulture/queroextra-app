import { supabase } from '@/lib/supabase'
import { stripCnpjCpf } from '@/lib/validators/cnpjCpf'
import type { EmpresaArea } from '@/constants/empresaAreas'

export interface EmpresaEtapa1Data {
  nome: string
  cnpj_cpf: string
  email: string
  password: string
  area: EmpresaArea
  avatar_url?: string | null
}

export async function createEmpresaRecords(userId: string, data: EmpresaEtapa1Data) {
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      tipo: 'empresa',
      nome: data.nome,
      email: data.email,
      avatar_url: data.avatar_url ?? null,
      status: 'ativo',
    },
    { onConflict: 'id' }
  )
  if (profileError) throw profileError

  const { error: companyError } = await supabase.from('companies').upsert(
    {
      profile_id: userId,
      cnpj_cpf: stripCnpjCpf(data.cnpj_cpf),
      area: data.area,
      status: 'pendente',
    },
    { onConflict: 'profile_id' }
  )
  if (companyError) throw companyError
}

export async function getEmpresaPostLoginPath(userId: string): Promise<string> {
  const { data: company, error } = await supabase
    .from('companies')
    .select('status, documento_url')
    .eq('profile_id', userId)
    .maybeSingle()

  if (error || !company) return '/cadastro/empresa/documentos'

  const hasDocs = Array.isArray(company.documento_url) && company.documento_url.length > 0
  if (!hasDocs) return '/cadastro/empresa/documentos'
  if (company.status === 'aprovado') return '/empresa'
  return '/empresa/aguardando'
}

export async function notifyAdminNewCompanySignup(profileId: string) {
  try {
    await supabase.functions.invoke('notify-admin-company-signup', {
      body: { profile_id: profileId },
    })
  } catch {
    // Resend/edge function pode não estar configurado ainda
  }
}
