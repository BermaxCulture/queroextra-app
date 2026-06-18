/**
 * Script: busca o status da proposta e URL de KYC diretamente da Valida Pay
 * Uso: node scripts/get-proposal-status.js
 */

const FORM_ID = '42334f9b-059e-45c8-8f3f-d9caca2a84fe'

const AUTH_URL    = 'https://oauth2-sandbox.validapay.com.br'
const BASE_URL    = 'https://sandbox.validapay.com.br'
const CLIENT_ID     = process.env.VALIDAPAY_CLIENT_ID
const CLIENT_SECRET = process.env.VALIDAPAY_CLIENT_SECRET

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Defina VALIDAPAY_CLIENT_ID e VALIDAPAY_CLIENT_SECRET como variáveis de ambiente')
  console.error('   Exemplo: VALIDAPAY_CLIENT_ID=xxx VALIDAPAY_CLIENT_SECRET=yyy node scripts/get-proposal-status.js')
  process.exit(1)
}

async function getToken() {
  const res = await fetch(`${AUTH_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'proposals/write subaccounts/read',
    }).toString(),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Auth falhou: ${res.status} — ${t}`)
  }
  const data = await res.json()
  return data.access_token
}

async function main() {
  console.log('🔐 Obtendo token...')
  const token = await getToken()
  console.log('✅ Token obtido\n')

  console.log(`📋 Buscando proposta: ${FORM_ID}`)
  const res = await fetch(`${BASE_URL}/v1/proposals/${FORM_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const body = await res.text()
  console.log(`Status HTTP: ${res.status}`)

  try {
    const data = JSON.parse(body)
    console.log('\n📄 Resposta da Valida Pay:')
    console.log(JSON.stringify(data, null, 2))

    const url = data?.proposalStatus?.urlDocumentscopy ?? data?.urlDocumentscopy ?? null
    if (url) {
      console.log('\n🔗 URL de KYC encontrada:')
      console.log(url)
      console.log('\n👆 Abra esse link no navegador para fazer o upload de documentos')
    } else {
      console.log('\n⚠️  URL de KYC não encontrada na resposta — proposta pode estar pendente ou rejeitada')
    }
  } catch {
    console.log('Body raw:', body)
  }
}

main().catch(console.error)
