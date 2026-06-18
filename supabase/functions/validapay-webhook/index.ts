import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Verificação de Assinatura HMAC-SHA256 ────────────────────────────────────
async function verifySignature(body: string, signatureHeader: string | null, secret: string): Promise<boolean> {
  if (!signatureHeader) return false

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => p.split('=') as [string, string])
  )
  const timestamp = parts['t']
  const receivedSig = parts['v1']
  if (!timestamp || !receivedSig) return false

  // Proteção contra replay attack (5 minutos)
  const age = Date.now() - parseInt(timestamp, 10)
  if (age > 5 * 60 * 1000) {
    console.warn('[webhook] Evento rejeitado: timestamp muito antigo', { age })
    return false
  }

  // HMAC-SHA256 usando Web Crypto API do Deno
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuffer = await crypto.subtle.sign(
    'HMAC',
    keyMaterial,
    encoder.encode(`${timestamp}.${body}`)
  )
  const expectedSig = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Comparação segura (evita timing attacks)
  if (expectedSig.length !== receivedSig.length) return false
  let mismatch = 0
  for (let i = 0; i < expectedSig.length; i++) {
    mismatch |= expectedSig.charCodeAt(i) ^ receivedSig.charCodeAt(i)
  }
  return mismatch === 0
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ─── Lê o body como texto (necessário para verificar a assinatura) ──────────
    const rawBody = await req.text()
    const signatureHeader = req.headers.get('x-webhook-signature')
    const webhookSecret = Deno.env.get('VALIDAPAY_WEBHOOK_SECRET') ?? ''

    if (webhookSecret) {
      const valid = await verifySignature(rawBody, signatureHeader, webhookSecret)
      if (!valid) {
        console.error('[webhook] Assinatura inválida:', signatureHeader)
        return new Response(JSON.stringify({ error: 'Assinatura inválida' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        })
      }
    } else {
      console.warn('[webhook] VALIDAPAY_WEBHOOK_SECRET não definido — verificação de assinatura desabilitada')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Usando Service Role para ignorar RLS no webhook
    )

    const payload = JSON.parse(rawBody)
    console.log('Webhook recebido da ValidaPay:', JSON.stringify(payload, null, 2))

    // 1. Aprovação de Subconta (account_approved)
    if (payload.event === 'account_approved') {
      const accountNumber = payload.account?.account
      const documentNumber = payload.documentNumber

      if (!accountNumber || !documentNumber) {
        throw new Error('Payload inválido: account.account ou documentNumber ausente')
      }

      // Atualiza o freelancer pelo CPF (documentNumber)
      const { data, error } = await supabaseClient
        .from('freelancers')
        .update({
          validapay_onboarding_status: 'aprovado',
          validapay_account_number: accountNumber,
        })
        .eq('cpf', documentNumber)
        .select()

      if (error) {
        console.error('Erro ao atualizar freelancer:', error)
        throw error
      }

      console.log(`Freelancer aprovado! CPF: ${documentNumber}, Conta: ${accountNumber}`)

      return new Response(JSON.stringify({ message: 'Webhook account_approved processado com sucesso' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 2. Confirmação de Pagamento PIX (charge.paid)
    if (payload.event === 'charge.paid' || (payload.event === 'charge.updated' && payload.status === 'PAID')) {
      const chargeId = payload.chargeId || payload.id

      if (!chargeId) {
        throw new Error('Payload inválido: chargeId ausente')
      }

      // Atualiza a transação para retido
      const { data: txData, error: txError } = await supabaseClient
        .from('transactions')
        .update({ status: 'retido' })
        .eq('gateway_charge_id', chargeId)
        .select('application_id')
        .single()

      if (txError) {
        console.error('Erro ao atualizar transação para retido:', txError)
        throw txError
      }

      // Atualiza a candidatura para aprovado
      if (txData && txData.application_id) {
        const { error: appError } = await supabaseClient
          .from('applications')
          .update({ status: 'aprovado' })
          .eq('id', txData.application_id)

        if (appError) {
          console.error('Erro ao atualizar candidatura para aprovado:', appError)
        }
      }

      console.log(`Pagamento confirmado! chargeId: ${chargeId}`)

      return new Response(JSON.stringify({ message: 'Webhook charge.paid processado com sucesso' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    // 3. Recebimento de Link de Documentos (onboarding.documentscopy)
    // Estrutura real do payload (conforme doc e evento account_approved como referência):
    // {
    //   event: 'onboarding.documentscopy',
    //   formId: 'xxx',
    //   proposalStatus: { urlDocumentscopy: 'https://...' }
    // }
    // Também pode chegar sem 'event', com status PENDING e a url dentro do payload
    if (payload.event === 'onboarding.documentscopy' || payload.event === 'onboarding.documents_copy') {
      // Tenta ler o formId e a url de acordo com variações possíveis do payload
      const formId = payload.formId ?? payload.data?.proposalId ?? payload.proposalId
      const url =
        payload.proposalStatus?.urlDocumentscopy ??
        payload.data?.url ??
        payload.url

      console.log(`[onboarding.documentscopy] formId: ${formId}, url: ${url}`)

      if (!formId) {
        console.error('[onboarding.documentscopy] formId ausente no payload:', JSON.stringify(payload))
        // Retorna 200 para não causar retentativas infinitas da ValidaPay
        return new Response(JSON.stringify({ message: 'formId ausente, evento ignorado' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      if (url) {
        const { error } = await supabaseClient
          .from('freelancers')
          .update({ validapay_url_documentscopy: url })
          .eq('validapay_form_id', formId)

        if (error) {
          console.error('Erro ao salvar URL de documentos:', error)
          throw error
        }
        console.log(`URL de documentos salva para formId: ${formId} -> ${url}`)
      } else {
        console.warn(`[onboarding.documentscopy] URL não encontrada no payload. formId: ${formId}. Payload completo:`, JSON.stringify(payload))
      }

      return new Response(JSON.stringify({ message: 'Webhook documentscopy processado com sucesso' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 4. Conta Criada (payload final sem event)
    if (!payload.event && payload.formId && payload.accountNumber) {
      const formId = payload.formId
      const accountNumber = payload.accountNumber

      const { error } = await supabaseClient
        .from('freelancers')
        .update({
          validapay_onboarding_status: 'aprovado',
          validapay_account_number: accountNumber
        })
        .eq('validapay_form_id', formId)

      if (error) {
        console.error('Erro ao aprovar conta final:', error)
        throw error
      }
      
      console.log(`Conta final aprovada! formId: ${formId}, Conta: ${accountNumber}`)
      return new Response(JSON.stringify({ message: 'Webhook de conta criada processado com sucesso' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    // Retorno padrão para eventos não mapeados ou não suportados ainda
    return new Response(JSON.stringify({ message: 'Evento recebido, mas nenhuma ação mapeada foi executada' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro no webhook:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
