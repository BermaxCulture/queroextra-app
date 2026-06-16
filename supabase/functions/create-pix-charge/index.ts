import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validaPayFetch } from '../_shared/validapay.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- Auth ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autorizado' }, 401)

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await anonClient.auth.getUser()
    if (authError || !user) return json({ error: 'Não autorizado' }, 401)

    // Service role para operações no banco sem RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // --- Parâmetro único aceito do body ---
    const { application_id } = await req.json()
    if (!application_id) return json({ error: 'application_id é obrigatório' }, 400)

    // --- Idempotência: retorna transação existente se já foi criada ---
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id, gateway_charge_id, emv, status')
      .eq('application_id', application_id)
      .maybeSingle()

    if (existingTx?.gateway_charge_id) {
      console.log(`[create-pix-charge] Retornando transação existente para application_id: ${application_id}`)
      return json({ chargeId: existingTx.gateway_charge_id, emv: existingTx.emv })
    }

    // --- Busca candidatura + vaga + freelancer ---
    // Valida ownership: a vaga deve pertencer à empresa do usuário autenticado
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        freelancer_id,
        jobs (
          id,
          valor,
          company_id,
          companies ( profile_id )
        ),
        freelancers (
          id,
          validapay_account_number,
          validapay_onboarding_status
        )
      `)
      .eq('id', application_id)
      .single()

    if (appError || !application) {
      return json({ error: 'Candidatura não encontrada' }, 404)
    }

    // --- Valida status da candidatura ---
    if (application.status === 'aprovado') {
      return json({ error: 'Esta candidatura já foi aprovada.' }, 409)
    }

    const job = application.jobs as any
    const freelancer = application.freelancers as any
    const company = job?.companies

    // --- Ownership: só a empresa dona da vaga pode aprovar ---
    if (!company || company.profile_id !== user.id) {
      return json({ error: 'Sem permissão para aprovar esta candidatura' }, 403)
    }

    // --- Valida subconta do freelancer ---
    if (
      freelancer?.validapay_onboarding_status !== 'aprovado' ||
      !freelancer?.validapay_account_number
    ) {
      return json(
        { error: 'Freelancer não possui conta Valida Pay aprovada. Oriente o freelancer a completar o onboarding.' },
        422
      )
    }

    // --- Calcula split ---
    const valorBruto = Number(job.valor)
    const taxaPlataforma = 10.0 // R$ 10 fixo para a conta master
    const valorLiquido = valorBruto - taxaPlataforma

    if (valorLiquido <= 0) {
      return json({ error: 'Valor da vaga deve ser maior que R$ 10,00 (taxa da plataforma)' }, 422)
    }

    // --- Gera idempotency_key ---
    const idempotency_key = `qe-${application_id}`

    // --- Chama a Valida Pay ---
    const pixBody = {
      amount: valorBruto,
      split: [
        // Apenas o split do freelancer é declarado como fixed.
        // A conta master retém automaticamente o restante (≈ R$10 menos a taxa da Valida Pay).
        { type: 'fixed', accountNumber: freelancer.validapay_account_number, amount: valorLiquido },
      ],
      metadata: {
        applicationId: application_id,
        jobId: job.id,
        freelancerId: freelancer.id,
      },
    }

    console.log('[create-pix-charge] Enviando para Valida Pay:', JSON.stringify(pixBody))
    console.log('[create-pix-charge] BASE_URL:', Deno.env.get('VALIDAPAY_BASE_URL'))
    console.log('[create-pix-charge] AUTH_URL:', Deno.env.get('VALIDAPAY_AUTH_URL'))

    const pixRes = await validaPayFetch('/v1/charges/pix', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotency_key },
      body: JSON.stringify(pixBody),
    })

    console.log('[create-pix-charge] Valida Pay status:', pixRes.status)

    if (!pixRes.ok) {
      const errText = await pixRes.text()
      console.error('[create-pix-charge] Valida Pay error body:', errText)
      return json({ error: `Erro ao gerar PIX na Valida Pay: ${errText}` }, 502)
    }

    const chargeData = await pixRes.json()
    // chargeData = { chargeId: string, emv: string, ... }

    // --- Cria transação com status 'retido' ---
    const { error: txError } = await supabase.from('transactions').insert({
      job_id: job.id,
      application_id,
      valor_bruto: valorBruto,
      taxa_plataforma: taxaPlataforma,
      valor_liquido: valorLiquido,
      gateway_charge_id: chargeData.chargeId,
      emv: chargeData.emv,
      idempotency_key,
      status: 'retido',
    })

    if (txError) {
      // Se falhar por conflito de idempotência (race condition), retorna a existente
      if (txError.code === '23505') {
        const { data: raceTx } = await supabase
          .from('transactions')
          .select('gateway_charge_id, emv')
          .eq('idempotency_key', idempotency_key)
          .single()
        return json({ chargeId: raceTx?.gateway_charge_id, emv: raceTx?.emv })
      }
      console.error('[create-pix-charge] Erro ao salvar transação:', txError)
      // Não interrompe — a cobrança já foi criada na Valida Pay
    }

    return json({ chargeId: chargeData.chargeId, emv: chargeData.emv })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[create-pix-charge] Erro:', message)
    return json({ error: message }, 500)
  }
})
