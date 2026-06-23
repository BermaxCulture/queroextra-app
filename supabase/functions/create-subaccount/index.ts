import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validaPayFetch } from '../_shared/validapay.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Extrai o usuário autenticado do JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Não autorizado' }, 401)
    }

    const { data: { user }, error: authError } = await createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser()

    if (authError || !user) {
      return json({ error: 'Não autorizado' }, 401)
    }

    const body = await req.json()
    const {
      // Endereço
      cep, rua, numero, complemento, bairro, cidade, estado,
      // Dados financeiros
      faixa_renda, ocupacao, faixa_patrimonio,
      // Dados pessoais (já existem no perfil, enviados pelo frontend)
      nome_mae, data_nascimento, pessoa_politicamente_exposta,
      // Chave PIX para repasse pós-checkout
      pix_key, pix_key_type,
    } = body

    if (!pix_key || !pix_key_type) {
      return json({ error: 'Chave PIX obrigatória' }, 400)
    }

    const PIX_KEY_TYPES = ['cpf', 'telefone', 'email', 'chave_aleatoria']
    if (!PIX_KEY_TYPES.includes(pix_key_type)) {
      return json({ error: 'Tipo de chave PIX inválido' }, 400)
    }

    // V-05: Whitelist dos valores aceitos para dados financeiros
    const RENDA_VALIDOS = ['DINP01', 'DINP02', 'DINP03', 'DINP04', 'DINP05']
    const OCUPACAO_VALIDOS = Array.from({ length: 32 }, (_, i) => `ONP${String(i + 1).padStart(2, '0')}`)
    const PATRIMONIO_VALIDOS = ['NWNP01', 'NWNP02', 'NWNP03', 'NWNP04', 'NWNP05']

    if (!RENDA_VALIDOS.includes(faixa_renda)) return json({ error: 'Faixa de renda inválida' }, 400)
    if (!OCUPACAO_VALIDOS.includes(ocupacao)) return json({ error: 'Ocupação inválida' }, 400)
    if (!PATRIMONIO_VALIDOS.includes(faixa_patrimonio)) return json({ error: 'Faixa patrimonial inválida' }, 400)

    // Busca perfil + freelancer do usuário autenticado
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, nome, email, celular')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return json({ error: 'Perfil não encontrado' }, 404)
    }

    const { data: freelancer, error: freelancerError } = await supabase
      .from('freelancers')
      .select('id, cpf, validapay_onboarding_status')
      .eq('profile_id', user.id)
      .single()

    if (freelancerError || !freelancer) {
      return json({ error: 'Freelancer não encontrado' }, 404)
    }

    // Não reprocessar se já aprovado
    if (freelancer.validapay_onboarding_status === 'aprovado') {
      return json({ error: 'Subconta já aprovada' }, 409)
    }

    if (!freelancer.cpf) {
      return json({ error: 'CPF não cadastrado no perfil' }, 400)
    }

    // Salva endereço no perfil
    await supabase.from('profiles').update({
      cep, rua, numero, complemento, bairro, cidade, estado,
    }).eq('id', user.id)

    // Salva dados financeiros + chave PIX no freelancer
    await supabase.from('freelancers').update({
      faixa_renda,
      ocupacao,
      faixa_patrimonio,
      pix_key,
      pix_key_type,
      validapay_onboarding_status: 'em_analise',
    }).eq('id', freelancer.id)

    // Cria proposta de subconta PF na Valida Pay
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const webhookUrl = `${supabaseUrl}/functions/v1/validapay-webhook`

    // Converte DD-MM-YYYY → YYYY-MM-DD (formato exigido pela Valida Pay)
    const [dd, mm, yyyy] = data_nascimento.split('-')
    const birthDateISO = `${yyyy}-${mm}-${dd}`

    // Mapeia códigos internos para valores reais (API Valida Pay exige valores decimais e texto livre)
    const RENDA_MAP: Record<string, string> = {
      'DINP01': '2500.00', 'DINP02': '7500.00', 'DINP03': '20000.00',
      'DINP04': '65000.00', 'DINP05': '150000.00',
    }
    const OCUPACAO_MAP: Record<string, string> = {
      'ONP01': 'Administrador', 'ONP02': 'Vendedor', 'ONP03': 'Analista de RH',
      'ONP04': 'Analista Financeiro', 'ONP05': 'Desenvolvedor', 'ONP06': 'Marketing',
      'ONP07': 'Médico', 'ONP08': 'Professor', 'ONP09': 'Engenheiro', 'ONP10': 'Advogado',
      'ONP11': 'Auxiliar de Serviços Gerais', 'ONP12': 'Pedreiro', 'ONP13': 'Motorista',
      'ONP14': 'Recepcionista', 'ONP15': 'Técnico', 'ONP16': 'Designer',
      'ONP17': 'Operador de Máquinas', 'ONP18': 'Consultor', 'ONP19': 'Cabeleireiro',
      'ONP20': 'Vigilante', 'ONP21': 'Trabalhador Rural', 'ONP22': 'Hoteleiro',
      'ONP23': 'Jornalista', 'ONP24': 'Psicólogo', 'ONP25': 'Servidor Público',
      'ONP26': 'Pesquisador', 'ONP27': 'Artesão', 'ONP28': 'Aposentado',
      'ONP29': 'Estudante', 'ONP30': 'Autônomo', 'ONP31': 'Outros', 'ONP32': 'Arquiteto',
    }
    const PATRIMONIO_MAP: Record<string, string> = {
      'NWNP01': '25000.00', 'NWNP02': '125000.00', 'NWNP03': '600000.00',
      'NWNP04': '3000000.00', 'NWNP05': '10000000.00',
    }

    const proposalRes = await validaPayFetch('/v1/proposals', {
      method: 'POST',
      body: JSON.stringify({
        documentNumber: freelancer.cpf.replace(/\D/g, ''),
        phoneNumber: formatPhone(profile.celular ?? ''),
        email: profile.email,
        fullName: profile.nome,
        socialName: '',
        birthDate: birthDateISO,
        motherName: nome_mae,
        isPoliticallyExposedPerson: pessoa_politicamente_exposta ?? false,
        address: {
          postalCode: cep.replace(/\D/g, ''),
          street: rua,
          number: numero,
          addressComplement: complemento ?? '',
          neighborhood: bairro,
          city: cidade,
          state: estado,
        },
        financialDetails: {
          declaredIncome: RENDA_MAP[faixa_renda] ?? faixa_renda,
          occupation: OCUPACAO_MAP[ocupacao] ?? ocupacao,
          netWorth: PATRIMONIO_MAP[faixa_patrimonio] ?? faixa_patrimonio,
        },
        webhookUrl,
      }),
    })

    if (!proposalRes.ok) {
      const errText = await proposalRes.text()
      console.error('[create-subaccount] ValidaPay error:', errText)
      // Reverte status para null para permitir nova tentativa
      await supabase.from('freelancers').update({
        validapay_onboarding_status: null,
      }).eq('id', freelancer.id)
      return json({ error: 'Erro ao criar subconta na ValidaPay', details: errText }, 502)
    }

    const proposal = await proposalRes.json()

    if (!proposal.formId) {
      console.error('[create-subaccount] formId ausente:', JSON.stringify(proposal))
      await supabase.from('freelancers').update({ validapay_onboarding_status: null }).eq('id', freelancer.id)
      return json({ error: 'Resposta inválida da ValidaPay: formId ausente' }, 502)
    }

    // Busca URL de KYC — em propostas UNFINISHED a API ainda retorna proposalStatus
    // como objeto com urlDocumentscopy; tenta múltiplos paths por segurança
    let urlDocumentscopy: string | null = null
    try {
      const statusRes = await validaPayFetch(`/v1/proposals/${proposal.formId}`)
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        console.log('[create-subaccount] GET proposal:', JSON.stringify(statusData))
        urlDocumentscopy =
          statusData?.proposalStatus?.urlDocumentscopy ??
          statusData?.urlDocumentscopy ??
          statusData?.data?.urlDocumentscopy ??
          null
      }
    } catch (e) {
      console.warn('[create-subaccount] Falha ao buscar URL de documentos:', e)
    }

    await supabase.from('freelancers').update({
      validapay_form_id: proposal.formId,
      validapay_url_documentscopy: urlDocumentscopy,
    }).eq('id', freelancer.id)

    return json({ ok: true, formId: proposal.formId, urlDocumentscopy })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[create-subaccount] Erro:', message)
    return json({ error: message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function formatPhone(celular: string): string {
  const digits = celular.replace(/\D/g, '')
  if (digits.startsWith('55')) return `+${digits}`
  if (digits.length === 11) return `+55${digits}`
  return `+55${digits}`
}
