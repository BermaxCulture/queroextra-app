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

    const { chargeId, application_id } = await req.json()
    if (!chargeId && !application_id) {
      return json({ error: 'chargeId ou application_id é obrigatório' }, 400)
    }

    // ── Caminho 1: já existe uma cobrança PIX (fluxo normal + botão "Simular pagamento") ──
    if (chargeId) {
      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .select('id, status, application_id, job_id, jobs!inner(company_id, companies!inner(profile_id))')
        .eq('gateway_charge_id', chargeId)
        .single()

      if (txError || !tx) return json({ error: 'Transação não encontrada' }, 404)

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
    }

    // ── Caminho 2: pula a geração de PIX inteiramente (aprovação direta em sandbox) ──
    // Idempotência — se já existe cobrança ativa para esta candidatura, apenas garante o status.
    const { data: existing } = await supabase
      .from('transactions')
      .select('id, status')
      .eq('application_id', application_id)
      .in('status', ['pendente', 'retido'])
      .maybeSingle()

    if (existing) {
      if (existing.status === 'pendente') {
        await supabase
          .from('transactions')
          .update({ status: 'retido', paid_at: new Date().toISOString() })
          .eq('id', existing.id)
      }
      await supabase.from('applications').update({ status: 'aprovado' }).eq('id', application_id)
      return json({ ok: true })
    }

    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id, status, jobs ( id, titulo, valor, company_id )')
      .eq('id', application_id)
      .single()

    if (appError || !application) return json({ error: 'Candidatura não encontrada' }, 404)

    const job = application.jobs as any

    // Verifica que a vaga pertence à empresa autenticada
    const { data: company } = await supabase
      .from('companies')
      .select('id, is_test_account')
      .eq('profile_id', user.id)
      .single()

    if (!company || job.company_id !== company.id) {
      return json({ error: 'Acesso negado: esta candidatura não pertence à sua empresa' }, 403)
    }

    // Valor real da vaga — mesma regra do create-pix-charge (empresas de
    // teste usam vagas de valor baixo real, não um modo global reduzido).
    // Taxa fixa de R$10 zerada para conta de teste, senão valores baixos
    // nunca fechariam a conta (valorLiquido negativo).
    const valorBruto = Number(job.valor)
    const taxaPlataforma = company.is_test_account ? 0 : 10.0
    const valorLiquido = valorBruto - taxaPlataforma
    if (valorLiquido <= 0) {
      return json({ error: 'Valor da vaga é menor ou igual à taxa da plataforma' }, 422)
    }

    const { error: txError } = await supabase.from('transactions').insert({
      job_id: job.id,
      application_id,
      valor_bruto: valorBruto,
      taxa_plataforma: taxaPlataforma,
      valor_liquido: valorLiquido,
      gateway_charge_id: `sandbox-sim-${crypto.randomUUID()}`,
      status: 'retido',
      paid_at: new Date().toISOString(),
      is_test: company.is_test_account === true,
    })

    if (txError) throw new Error(txError.message)

    await supabase.from('applications').update({ status: 'aprovado' }).eq('id', application_id)

    console.log(`[simulate-payment] Aprovação direta simulada — application_id: ${application_id}`)
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
