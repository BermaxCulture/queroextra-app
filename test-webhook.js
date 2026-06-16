#!/usr/bin/env node
/**
 * Script de teste do webhook Valida Pay
 * 
 * Uso:
 *   node test-webhook.js account_approved
 *   node test-webhook.js documentscopy
 *   node test-webhook.js charge_paid <chargeId>
 */

import crypto from 'node:crypto'

const WEBHOOK_URL = 'https://bgkbruloojndolgtring.supabase.co/functions/v1/validapay-webhook'
const SIGNING_SECRET = '1524e98db960f9361f8b97034fc38bc9f72dfc52a230184743059203579f3c59'

// Payloads de teste por tipo de evento
const PAYLOADS = {
  account_approved: {
    event: 'account_approved',
    account: { account: '9876543210' },
    documentNumber: '06722151280', // CPF do freelancer de teste
  },
  documentscopy: {
    event: 'onboarding.documentscopy',
    formId: '42334f9b-059e-45c8-8f3f-d9caca2a84fe', // substitua pelo formId real no banco
    proposalStatus: {
      urlDocumentscopy: 'https://kyc.validapay.com.br/test-session-abc123',
    },
  },
  charge_paid: {
    event: 'charge.paid',
    chargeId: process.argv[3] || 'CHARGE_ID_AQUI',
    status: 'PAID',
  },
}

async function sendWebhook(eventType) {
  const payload = PAYLOADS[eventType]
  if (!payload) {
    console.error(`❌ Evento desconhecido: ${eventType}`)
    console.log('Eventos disponíveis:', Object.keys(PAYLOADS).join(', '))
    process.exit(1)
  }

  const body = JSON.stringify(payload)
  const timestamp = Date.now().toString()

  // Gera HMAC-SHA256 exatamente como a Valida Pay faria
  const expectedSig = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(`${timestamp}.${body}`)
    .digest('hex')

  const signatureHeader = `t=${timestamp},v1=${expectedSig}`

  console.log('\n📤 Enviando webhook de teste...')
  console.log('  Evento:', eventType)
  console.log('  URL:', WEBHOOK_URL)
  console.log('  Signature:', signatureHeader)
  console.log('  Body:', JSON.stringify(payload, null, 2))

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signatureHeader,
    },
    body,
  })

  const responseText = await res.text()

  console.log('\n📥 Resposta:')
  console.log('  Status:', res.status, res.statusText)
  try {
    console.log('  Body:', JSON.stringify(JSON.parse(responseText), null, 2))
  } catch {
    console.log('  Body:', responseText)
  }

  if (res.ok) {
    console.log('\n✅ Sucesso!')
  } else {
    console.log('\n❌ Falhou. Verifique os logs em:')
    console.log('   https://supabase.com/dashboard/project/bgkbruloojndolgtring/functions')
  }
}

const eventType = process.argv[2] || 'account_approved'
sendWebhook(eventType).catch(console.error)
