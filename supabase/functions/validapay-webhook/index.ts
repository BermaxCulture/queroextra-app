import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { notifyApplication } from '../_shared/notify.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const REPLAY_WINDOW_MS = 5 * 60 * 1000 // 5 minutos, conforme doc da Valida Pay

// Comparação em tempo constante — evita vazar o segredo via timing attack.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ─── Layout base de e-mail (mesmo estilo visual dos outros e-mails do projeto) ─

function emailLayout(opts: { emoji: string; title: string; body: string; cta?: { label: string; url: string } }): string {
  const ctaHtml = opts.cta
    ? `<a href="${opts.cta.url}" style="display:inline-block;margin:0 0 8px;padding:16px 32px;background-color:#F5C000;color:#111111;font-size:16px;font-weight:700;text-decoration:none;border-radius:999px">${opts.cta.label}</a>`
    : ''

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="pt-BR">
  <head>
    <meta content="width=device-width" name="viewport" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style="background-color:#ffffff">
    <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
      <tbody>
        <tr>
          <td style="background-color:#ffffff">
            <table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
              style="max-width:600px;align:left;width:100%;color:#000000;background-color:#ffffff;border-radius:0px;border-color:#000000">
              <tbody>
                <tr style="width:100%">
                  <td style="padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px">
                    <div style="margin:0 auto;padding:0;font-family:'DM Sans', Arial, sans-serif;max-width:600px;background-color:#FFFFFF;border:1px solid #E5E5E5;border-radius:12px;overflow:hidden;color:#1A1A1A;box-shadow:0 2px 8px rgba(0,0,0,0.05)">
                      <div style="margin:0;padding:32px 20px;background-color:#111111;text-align:center">
                        <h1 style="margin:0;padding:0;font-size:32px;font-weight:700;letter-spacing:-1px">
                          <span style="color:#FFFFFF">Quero</span><span style="color:#F5C000">Extra</span>
                        </h1>
                      </div>
                      <div style="margin:0;padding:40px 24px;text-align:center">
                        <div style="margin:0 auto 24px;padding:0;width:56px;height:56px;background-color:#FFF8E1;border-radius:999px;display:flex;align-items:center;justify-content:center">
                          <p style="margin:0;padding:0">${opts.emoji}</p>
                        </div>
                        <h2 style="margin:0 0 16px;padding:0;font-size:20px;font-weight:700;color:#1A1A1A;letter-spacing:-0.3px">
                          ${opts.title}
                        </h2>
                        <p style="margin:0 0 32px;padding:0;font-size:15px;line-height:1.6;color:#444444">
                          ${opts.body}
                        </p>
                        ${ctaHtml}
                      </div>
                      <div style="margin:0;padding:20px 24px;border-top:1px solid #E5E5E5;text-align:center">
                        <p style="margin:0;padding:0;font-size:12px;color:#999999">Quero Extra — Marketplace de Freelancers para Food Service</p>
                      </div>
                    </div>
                    <p style="margin:0;padding:0"><br /></p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`
}

function emailDocumentscopyPending(nome: string, url: string): string {
  return emailLayout({
    emoji: '📋',
    title: `Falta pouco, ${nome}!`,
    body: 'Recebemos seus dados. Agora envie uma foto dos seus documentos para concluirmos a validação de identidade e liberar sua conta de recebimento.',
    cta: { label: 'Enviar documentos', url },
  })
}

function emailDocumentsReceived(nome: string): string {
  return emailLayout({
    emoji: '✅',
    title: `Recebemos seus documentos, ${nome}!`,
    body: 'Seus documentos foram recebidos e passaram na checagem inicial. Agora sua conta está na análise final — isso pode levar até 24h. Vamos te avisar assim que estiver aprovada.',
  })
}

function emailDocumentsRejected(nome: string, appUrl: string | null): string {
  return emailLayout({
    emoji: '⚠️',
    title: `Não foi possível validar seus documentos, ${nome}`,
    body: 'Alguma informação não passou na nossa checagem — pode ser uma foto ilegível, dados divergentes ou documento vencido. Você pode tentar novamente direto pelo app.',
    cta: appUrl ? { label: 'Tentar novamente', url: `${appUrl}/login` } : undefined,
  })
}

function emailAccountApproved(nome: string, appUrl: string | null): string {
  return emailLayout({
    emoji: '🎉',
    title: `Sua conta foi aprovada, ${nome}!`,
    body: 'Sua conta de recebimento está pronta. Agora você já pode se candidatar a vagas no QueroExtra e receber seus pagamentos direto por Pix.',
    cta: appUrl ? { label: 'Entrar no QueroExtra', url: `${appUrl}/login` } : undefined,
  })
}

// ─── Envio via Resend ───────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'Quero Extra <noreply@queroextra.com>'
  if (!resendKey) return

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: fromEmail, to: [to], subject, html }),
    })
    if (!res.ok) {
      console.error('[validapay-webhook] Resend error:', await res.text())
    }
  } catch (e) {
    console.error('[validapay-webhook] Falha ao enviar e-mail:', e)
  }
}

// Normaliza a URL do app sem barra final, pra montar `${appUrl}/login` sem duplicar `/`
function getAppUrl(): string | null {
  const raw = Deno.env.get('APP_URL')
  if (!raw) return null
  return raw.replace(/\/+$/, '')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Lê o corpo cru primeiro — a assinatura HMAC é calculada sobre o texto
    // exato recebido (`{timestamp}.{body}`), não sobre o JSON reserializado.
    const rawBody = await req.text()

    // Dois mecanismos de autenticação ALTERNATIVOS (não os dois obrigatórios
    // ao mesmo tempo!) — webhooks diferentes (registro global vs webhookUrl
    // por proposta em create-subaccount) podem usar um ou outro. Passa se
    // qualquer um dos configurados validar; só rejeita se nenhum bater.
    const signingSecret = Deno.env.get('VALIDAPAY_WEBHOOK_SIGNING_SECRET')
    const legacySecret = Deno.env.get('VALIDAPAY_WEBHOOK_SECRET')
    let hmacValid = false
    let legacyValid = false

    // ── Mecanismo 1: assinatura HMAC (mecanismo oficial da Valida Pay) ────────
    // Header `x-webhook-signature: t={timestamp_ms},v1={hmac_sha256_hex}`.
    if (signingSecret) {
      const sigHeader = req.headers.get('x-webhook-signature') ?? ''
      const parts = Object.fromEntries(
        sigHeader.split(',').map((p) => p.split('=') as [string, string])
      )
      const timestamp = parts.t
      const receivedSig = parts.v1

      if (timestamp && receivedSig) {
        const age = Math.abs(Date.now() - Number(timestamp))
        if (Number.isFinite(age) && age <= REPLAY_WINDOW_MS) {
          const expectedSig = await hmacSha256Hex(signingSecret, `${timestamp}.${rawBody}`)
          if (timingSafeEqual(expectedSig, receivedSig)) {
            hmacValid = true
          }
        }
      }
    }

    // ── Mecanismo 2: segredo compartilhado legado (Authorization / ?secret=) ──
    // Usado por webhookUrls antigas registradas por proposta (create-subaccount).
    if (legacySecret) {
      const authHeader = req.headers.get('Authorization') ?? ''
      const providedHeaderSecret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
      const providedQuerySecret = new URL(req.url).searchParams.get('secret') ?? ''

      if (
        timingSafeEqual(providedHeaderSecret, legacySecret) ||
        timingSafeEqual(providedQuerySecret, legacySecret)
      ) {
        legacyValid = true
      }
    }

    const anyMechanismConfigured = Boolean(signingSecret || legacySecret)
    if (anyMechanismConfigured && !hmacValid && !legacyValid) {
      console.error('[validapay-webhook] Nenhum mecanismo de autenticação validou a requisição')
      return json({ error: 'Não autorizado' }, 401)
    }
    if (!anyMechanismConfigured) {
      console.warn('[validapay-webhook] Nenhum secret configurado — requisição aceita sem verificação.')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const payload = JSON.parse(rawBody)
    console.log('[validapay-webhook] Evento recebido:', JSON.stringify(payload, null, 2))

    const event = payload.event as string | undefined
    // Doc "Eventos de Onboarding" (pós-MVP): os campos ficam dentro de `data`.
    // Mantém fallback pro formato antigo (campos no nível raiz) por segurança.
    const data = payload.data ?? payload

    // Monta filtro OR pra casar o freelancer por formId e/ou proposalId —
    // são identificadores diferentes na ValidaPay (ver doc de Subcontas) e
    // cada evento de onboarding referencia um ou outro.
    function matchClause(formId?: string | null, proposalId?: string | null): string | null {
      const clauses: string[] = []
      if (formId) clauses.push(`validapay_form_id.eq.${formId}`)
      if (proposalId) clauses.push(`validapay_proposal_id.eq.${proposalId}`)
      return clauses.length > 0 ? clauses.join(',') : null
    }

    // Marca rejeição + envia e-mail de aviso — reaproveitado por
    // backgroundcheck, documentscopy e proposal, que podem rejeitar em
    // qualquer etapa do onboarding.
    async function handleRejection(proposalId: string | null, stage: string) {
      const filter = matchClause(null, proposalId)
      if (!filter) return

      const { data: updated, error } = await supabase
        .from('freelancers')
        .update({ validapay_onboarding_status: 'rejeitado' })
        .or(filter)
        .select('id, profiles(nome, email)')

      if (error) {
        console.error(`[validapay-webhook] Erro ao marcar rejeição (${stage}):`, error)
        return
      }

      console.log(`[validapay-webhook] Onboarding rejeitado (${stage}) — proposalId: ${proposalId}`)

      const profile = (updated?.[0] as any)?.profiles
      if (profile?.email) {
        await sendEmail(
          profile.email,
          '⚠️ Não foi possível validar seus documentos',
          emailDocumentsRejected(profile.nome ?? 'Prestador', getAppUrl())
        )
      }
    }

    // ── Aprovação final de subconta (onboarding.create) ───────────────────────
    const isAccountApproved =
      (event === 'onboarding.create' || event === 'account_approved') &&
      (data.status === 'CONFIRMED' || data.status === 'APPROVED')

    if (isAccountApproved) {
      const formId = data.formId ?? null
      const proposalId = data.proposalId ?? null
      const accountNumber = data.account?.number ?? data.account?.account ?? null
      const filter = matchClause(formId, proposalId)

      if (!filter || !accountNumber) {
        console.error('[validapay-webhook] Payload inválido para aprovação:', JSON.stringify(payload))
        return json({ error: 'Payload inválido: identificador ou número de conta ausente' }, 400)
      }

      const { data: updated, error } = await supabase
        .from('freelancers')
        .update({
          validapay_onboarding_status: 'aprovado',
          validapay_account_number: accountNumber,
        })
        .or(filter)
        .select('id, profiles(nome, email)')

      if (error) {
        console.error('[validapay-webhook] Erro ao aprovar freelancer:', error)
        return json({ error: 'Erro interno ao processar aprovação' }, 500)
      }

      console.log(`[validapay-webhook] Freelancer aprovado — formId: ${formId}, proposalId: ${proposalId}, conta: ${accountNumber}`)

      const profile = (updated?.[0] as any)?.profiles
      if (profile?.email) {
        await sendEmail(
          profile.email,
          '🎉 Sua conta foi aprovada!',
          emailAccountApproved(profile.nome ?? 'Prestador', getAppUrl())
        )
      }

      return json({ message: 'Aprovação processada com sucesso' })
    }

    // ── Link de documentos KYC / recebimento / rejeição ────────────────────────
    if (event === 'onboarding.documentscopy') {
      const proposalId = data.proposalId ?? null

      // status PENDING: gera o link de envio (fluxo já existente)
      if (data.status === 'PENDING' && data.url) {
        const filter = matchClause(null, proposalId)
        if (filter) {
          const { data: updated, error } = await supabase
            .from('freelancers')
            .update({ validapay_url_documentscopy: data.url })
            .or(filter)
            .select('id, profiles(nome, email)')

          if (error) {
            console.error('[validapay-webhook] Erro ao salvar URL de documentos:', error)
            return json({ error: 'Erro interno' }, 500)
          }

          console.log(`[validapay-webhook] URL de documentos salva — proposalId: ${proposalId}`)

          const profile = (updated?.[0] as any)?.profiles
          if (profile?.email) {
            await sendEmail(
              profile.email,
              '📋 Envie seus documentos para ativar sua conta',
              emailDocumentscopyPending(profile.nome ?? 'Prestador', data.url)
            )
          }
        }
        return json({ message: 'Evento documentscopy (pendente) processado' })
      }

      // status APPROVED: documentos recebidos e validados na checagem inicial
      if (data.status === 'APPROVED') {
        const filter = matchClause(null, proposalId)
        if (filter) {
          const { data: updated, error } = await supabase
            .from('freelancers')
            .update({ validapay_documents_received_at: new Date().toISOString() })
            .or(filter)
            .select('id, profiles(nome, email)')

          if (error) {
            console.error('[validapay-webhook] Erro ao marcar documentos recebidos:', error)
            return json({ error: 'Erro interno' }, 500)
          }

          console.log(`[validapay-webhook] Documentos recebidos — proposalId: ${proposalId}`)

          const profile = (updated?.[0] as any)?.profiles
          if (profile?.email) {
            await sendEmail(
              profile.email,
              '✅ Recebemos seus documentos',
              emailDocumentsReceived(profile.nome ?? 'Prestador')
            )
          }
        }
        return json({ message: 'Evento documentscopy (aprovado) processado' })
      }

      // status REJECTED: documentos recusados — libera nova tentativa
      if (data.status === 'REJECTED') {
        await handleRejection(proposalId, 'documentscopy')
        return json({ message: 'Evento documentscopy (rejeitado) processado' })
      }

      console.log(`[validapay-webhook] documentscopy — status inesperado: ${data.status}`)
      return json({ message: 'Evento documentscopy processado' })
    }

    // ── Background check / proposta rejeitados ─────────────────────────────────
    // backgroundcheck e proposal só importam pra gente quando rejeitam — a
    // aprovação final de verdade é sempre confirmada pelo onboarding.create.
    if (event === 'onboarding.backgroundcheck' || event === 'onboarding.proposal') {
      if (data.status === 'REJECTED') {
        await handleRejection(data.proposalId ?? null, event)
      } else {
        console.log(`[validapay-webhook] ${event} — status: ${data.status}`)
      }

      return json({ message: `Evento ${event} processado` })
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

      // Atualiza transaction para retido e registra paid_at — só transiciona
      // a partir de 'pendente'. Isso também é o que decide quem notifica: o
      // polling (get-charge-status) roda em paralelo e pode vencer essa
      // corrida; só quem efetivamente fizer a transição chama notify.
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .update({ status: 'retido', paid_at: new Date().toISOString() })
        .eq('gateway_charge_id', chargeId)
        .eq('status', 'pendente')
        .select('application_id')
        .maybeSingle()

      if (txError) {
        console.error('[validapay-webhook] Erro ao atualizar transação:', txError)
        return json({ error: 'Erro interno' }, 500)
      }

      if (!txData) {
        console.log(`[validapay-webhook] Pagamento já processado (ou charge não encontrada) — chargeId: ${chargeId}`)
        return json({ message: 'Evento já processado' })
      }

      // Atualiza candidatura para aprovado e notifica o freelancer (e-mail +
      // in-app) direto pelo backend — não depende do frontend estar aberto.
      if (txData.application_id) {
        await supabase
          .from('applications')
          .update({ status: 'aprovado' })
          .eq('id', txData.application_id)

        await notifyApplication(txData.application_id, 'aprovado')
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
