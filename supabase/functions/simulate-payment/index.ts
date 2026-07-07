import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Auth: verifica que é uma empresa
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

    // Verifica que é empresa
    const { data: profile } = await supabase
      .from('profiles')
      .select('tipo')
      .eq('id', user.id)
      .single()

    if (profile?.tipo !== 'empresa') {
      return json({ error: 'Acesso negado: somente empresas podem simular pagamentos' }, 403)
    }

    const { chargeId } = await req.json()
    if (!chargeId) return json({ error: 'chargeId é obrigatório' }, 400)

    // Busca a transaction e valida ownership (vaga pertence à empresa)
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('id, status, application_id, job_id, jobs!inner(company_id, companies!inner(profile_id))')
      .eq('gateway_charge_id', chargeId)
      .single()

    if (txError || !tx) return json({ error: 'Transação não encontrada' }, 404)

    // Verifica ownership
    const companyProfileId = (tx.jobs as any)?.companies?.profile_id
    if (companyProfileId !== user.id) {
      return json({ error: 'Acesso negado: esta cobrança não pertence à sua empresa' }, 403)
    }

    if (tx.status !== 'pendente') {
      return json({ error: `Transação já está com status '${tx.status}'` }, 409)
    }

    // Simula o que o webhook payment.success faria
    await supabase
      .from('transactions')
      .update({ status: 'retido', paid_at: new Date().toISOString() })
      .eq('id', tx.id)

    if (tx.application_id) {
      await supabase
        .from('applications')
        .update({ status: 'aprovado' })
        .eq('id', tx.application_id)
    }

    console.log(`[simulate-payment] Pagamento simulado — chargeId: ${chargeId}`)
    return json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[simulate-payment] Erro:', message)
    return json({ error: message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
