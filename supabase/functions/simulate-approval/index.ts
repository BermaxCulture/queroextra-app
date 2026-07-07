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

  // Camada de segurança: só funciona em sandbox
  const baseUrl = Deno.env.get('VALIDAPAY_BASE_URL') ?? ''
  if (!baseUrl.includes('sandbox')) {
    return json({ error: 'Rota disponível apenas em ambiente sandbox' }, 403)
  }

  try {
    // Auth: identifica o freelancer via JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autorizado' }, 401)

    const { data: { user }, error: authError } = await createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser()

    if (authError || !user) return json({ error: 'Não autorizado' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Busca o freelancer e seu CPF
    const { data: freelancer } = await supabase
      .from('freelancers')
      .select('id, cpf, validapay_onboarding_status, validapay_form_id')
      .eq('profile_id', user.id)
      .single()

    if (!freelancer) return json({ error: 'Freelancer não encontrado' }, 404)
    if (freelancer.validapay_onboarding_status === 'aprovado') {
      return json({ error: 'Conta já aprovada' }, 409)
    }
    if (!freelancer.validapay_form_id) {
      return json({ error: 'Proposta não encontrada — complete o onboarding primeiro' }, 400)
    }

    const cpfLimpo = (freelancer.cpf ?? '').replace(/\D/g, '')

    // Busca subcontas na Valida Pay para achar o accountNumber pelo CPF
    const subRes = await validaPayFetch('/v1/accounts/subaccounts')
    if (!subRes.ok) {
      const err = await subRes.text()
      console.error('[simulate-approval] Erro ao listar subcontas:', err)
      return json({ error: 'Falha ao consultar subcontas na Valida Pay' }, 502)
    }

    const subData = await subRes.json()
    console.log('[simulate-approval] Subcontas:', JSON.stringify(subData))

    const subAccounts: any[] = subData?.subAccounts ?? subData?.items ?? []
    const match = subAccounts.find((s: any) =>
      (s.documentNumber ?? '').replace(/\D/g, '') === cpfLimpo
    )

    if (!match) {
      return json({ error: 'Subconta não encontrada na Valida Pay para este CPF' }, 404)
    }

    const accountNumber = match.accountNumber
    console.log(`[simulate-approval] Aprovando freelancer ${user.id} — conta: ${accountNumber}`)

    // Atualiza o freelancer como aprovado
    const { error: updateError } = await supabase
      .from('freelancers')
      .update({
        validapay_onboarding_status: 'aprovado',
        validapay_account_number: accountNumber,
      })
      .eq('id', freelancer.id)

    if (updateError) {
      console.error('[simulate-approval] Erro ao atualizar freelancer:', updateError)
      return json({ error: 'Erro ao aprovar conta' }, 500)
    }

    return json({ ok: true, accountNumber })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[simulate-approval] Erro:', message)
    return json({ error: message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
