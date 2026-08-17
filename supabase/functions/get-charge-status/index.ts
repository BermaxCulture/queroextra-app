import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validaPayFetch } from '../_shared/validapay.ts'
import { notifyApplication } from '../_shared/notify.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth: identifica o usuário via JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autorizado' }, 401)

    const { data: { user }, error: authError } = await createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser()

    if (authError || !user) return json({ error: 'Não autorizado' }, 401)

    let chargeId = ''
    if (req.method === 'POST') {
      const body = await req.json()
      chargeId = body.chargeId
    } else {
      const url = new URL(req.url)
      chargeId = url.searchParams.get('chargeId') || ''
    }

    if (!chargeId) {
      return json({ error: 'chargeId é obrigatório' }, 400)
    }

    // Service role para validar ownership e persistir o resultado sem depender de RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Só a empresa dona da vaga pode consultar o status desta cobrança
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('id, status, application_id, jobs!inner(company_id, companies!inner(profile_id))')
      .eq('gateway_charge_id', chargeId)
      .single()

    if (txError || !tx) return json({ error: 'Transação não encontrada' }, 404)

    const companyProfileId = (tx.jobs as any)?.companies?.profile_id
    if (companyProfileId !== user.id) {
      return json({ error: 'Acesso negado: esta cobrança não pertence à sua empresa' }, 403)
    }

    const res = await validaPayFetch(`/v1/charges/${chargeId}`)

    if (!res.ok) {
      const errText = await res.text()
      return json({ error: `Erro ao consultar status na Valida Pay: ${errText}` }, 502)
    }

    const data = await res.json()

    // Confirmação autoritativa veio da própria Valida Pay — persiste no banco
    // (idempotente: só grava se ainda estiver 'pendente', mesma semântica do
    // webhook payment.success). Isso garante que applications.status vira
    // 'aprovado' mesmo se o webhook nunca chegar a ser configurado.
    // `.select()` confirma se ESTA chamada foi quem de fato fez a transição —
    // o webhook roda em paralelo e pode vencer a corrida; só quem transiciona
    // notifica, pra não duplicar e-mail/notificação.
    if (data?.status === 'PAID' && tx.status === 'pendente') {
      const { data: updated } = await supabase
        .from('transactions')
        .update({ status: 'retido', paid_at: new Date().toISOString() })
        .eq('id', tx.id)
        .eq('status', 'pendente')
        .select('id')
        .maybeSingle()

      if (updated && tx.application_id) {
        await supabase
          .from('applications')
          .update({ status: 'aprovado' })
          .eq('id', tx.application_id)

        await notifyApplication(tx.application_id, 'aprovado')
        console.log(`[get-charge-status] Pagamento confirmado via polling — chargeId: ${chargeId}`)
      }
    }

    return json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[get-charge-status] Erro:', message)
    return json({ error: message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
