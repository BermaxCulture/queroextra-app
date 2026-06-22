import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verifica authToken configurado ao registrar o webhook na Valida Pay
    const webhookSecret = Deno.env.get('VALIDAPAY_WEBHOOK_SECRET')
    if (webhookSecret) {
      const authHeader = req.headers.get('Authorization') ?? ''
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
      if (token !== webhookSecret) {
        console.error('[validapay-webhook] Assinatura inválida')
        return json({ error: 'Assinatura inválida' }, 401)
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const payload = await req.json()
    console.log('[validapay-webhook] Evento recebido:', JSON.stringify(payload, null, 2))

    const event = payload.event as string | undefined

    // ── Aprovação de subconta ─────────────────────────────────────────────────
    // NC-08: API nova usa 'onboarding.create'; mantém 'account_approved' para compatibilidade
    const isAccountApproved =
      (event === 'onboarding.create' || event === 'account_approved') &&
      (payload.status === 'CONFIRMED' || payload.status === 'APPROVED')

    if (isAccountApproved) {
      const formId = payload.formId
      // NC-08: campo varia por versão da API
      const accountNumber = payload.account?.account ?? payload.accountNumber

      if (!formId || !accountNumber) {
        console.error('[validapay-webhook] Payload inválido para aprovação:', JSON.stringify(payload))
        return json({ error: 'Payload inválido: formId ou accountNumber ausente' }, 400)
      }

      const { error } = await supabase
        .from('freelancers')
        .update({
          validapay_onboarding_status: 'aprovado',
          validapay_account_number: accountNumber,
        })
        .eq('validapay_form_id', formId)

      if (error) {
        console.error('[validapay-webhook] Erro ao aprovar freelancer:', error)
        return json({ error: 'Erro interno ao processar aprovação' }, 500)
      }

      console.log(`[validapay-webhook] Freelancer aprovado — formId: ${formId}, conta: ${accountNumber}`)
      return json({ message: 'Aprovação processada com sucesso' })
    }

    // ── Link de documentos KYC ───────────────────────────────────────────────
    if (event === 'onboarding.documentscopy') {
      const url = payload.data?.url ?? payload.url
      const formId = payload.data?.proposalId ?? payload.formId

      if (url && formId) {
        const { error } = await supabase
          .from('freelancers')
          .update({ validapay_url_documentscopy: url })
          .eq('validapay_form_id', formId)

        if (error) {
          console.error('[validapay-webhook] Erro ao salvar URL de documentos:', error)
          return json({ error: 'Erro interno' }, 500)
        }

        console.log(`[validapay-webhook] URL de documentos salva — formId: ${formId}`)
      }

      return json({ message: 'Evento documentscopy processado' })
    }

    // ── Pagamento PIX confirmado ──────────────────────────────────────────────
    // NC-08: API nova usa 'payment.success'; mantém variantes antigas para compatibilidade
    const isPaymentSuccess =
      event === 'payment.success' ||
      event === 'charge.paid' ||
      (event === 'charge.updated' && payload.status === 'PAID')

    if (isPaymentSuccess) {
      const chargeId = payload.chargeId ?? payload.id

      if (!chargeId) {
        console.error('[validapay-webhook] chargeId ausente no payload de pagamento')
        return json({ error: 'chargeId ausente' }, 400)
      }

      // Atualiza transaction para retido e registra paid_at
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .update({ status: 'retido', paid_at: new Date().toISOString() })
        .eq('gateway_charge_id', chargeId)
        .select('application_id')
        .maybeSingle()

      if (txError) {
        console.error('[validapay-webhook] Erro ao atualizar transação:', txError)
        return json({ error: 'Erro interno' }, 500)
      }

      // Atualiza candidatura para aprovado
      if (txData?.application_id) {
        await supabase
          .from('applications')
          .update({ status: 'aprovado' })
          .eq('id', txData.application_id)
      }

      console.log(`[validapay-webhook] Pagamento confirmado — chargeId: ${chargeId}`)
      return json({ message: 'Pagamento processado com sucesso' })
    }

    // ── Evento não mapeado ────────────────────────────────────────────────────
    console.log(`[validapay-webhook] Evento não mapeado: ${event}`)
    return json({ message: `Evento '${event}' recebido mas sem ação mapeada` })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[validapay-webhook] Erro:', message)
    return json({ error: message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
