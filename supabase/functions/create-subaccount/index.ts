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
    } = body

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

    // Salva dados financeiros no freelancer
    await supabase.from('freelancers').update({
      faixa_renda,
      ocupacao,
      faixa_patrimonio,
      validapay_onboarding_status: 'em_analise',
    }).eq('id', freelancer.id)

    // Cria proposta de subconta PF na Valida Pay
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const webhookUrl = `${supabaseUrl}/functions/v1/validapay-webhook`

    const proposalRes = await validaPayFetch('/v1/proposals', {
      method: 'POST',
      body: JSON.stringify({
        documentNumber: freelancer.cpf.replace(/\D/g, ''),
        phoneNumber: formatPhone(profile.celular ?? ''),
        email: profile.email,
        fullName: profile.nome,
        socialName: '',
        birthDate: data_nascimento,           // formato: "DD-MM-YYYY"
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
          declaredIncome: faixa_renda,
          occupation: ocupacao,
          netWorth: faixa_patrimonio,
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

    // Salva o formId para acompanhar o status
    await supabase.from('freelancers').update({
      validapay_form_id: proposal.formId,
    }).eq('id', freelancer.id)

    // Busca o status da proposta para obter a URL de KYC
    const statusRes = await validaPayFetch(`/v1/proposals/${proposal.formId}`)
    let urlDocumentscopy: string | null = null

    if (statusRes.ok) {
      const statusData = await statusRes.json()
      urlDocumentscopy = statusData?.proposalStatus?.urlDocumentscopy ?? null
    }

    return json({
      ok: true,
      formId: proposal.formId,
      urlDocumentscopy,
    })
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
