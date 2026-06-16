import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

async function getToken(): Promise<string> {
  const authUrl = Deno.env.get('VALIDAPAY_AUTH_URL')!
  const clientId = Deno.env.get('VALIDAPAY_CLIENT_ID')!
  const clientSecret = Deno.env.get('VALIDAPAY_CLIENT_SECRET')!
  const res = await fetch(`${authUrl}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'pix.cob/write pix.cob/read wallet/write wallet/read proposals/write subaccounts/read',
    }).toString(),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Auth falhou ${res.status}: ${JSON.stringify(data)}`)
  return data.access_token
}

Deno.serve(async () => {
  const baseUrl = Deno.env.get('VALIDAPAY_BASE_URL')!
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let token: string
  try {
    token = await getToken()
  } catch (e) {
    return new Response(JSON.stringify({ auth_error: String(e) }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: freelancers } = await supabase
    .from('freelancers')
    .select('id, cpf, validapay_form_id, validapay_onboarding_status, validapay_account_number')
    .not('validapay_form_id', 'is', null)

  const results = []

  for (const f of (freelancers ?? [])) {
    const endpoints = [
      `/v1/proposals/${f.validapay_form_id}`,
      `/v1/subaccounts?cpf=${f.cpf}`,
      `/v1/subaccounts/${f.cpf}`,
      `/v1/accounts?documentNumber=${f.cpf}`,
      `/v1/accounts/${f.cpf}`,
    ]

    const endpointResults: any = {}
    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
      let body: any
      try { body = await res.json() } catch { body = null }
      endpointResults[ep] = { status: res.status, body }
    }

    results.push({
      cpf: f.cpf,
      formId: f.validapay_form_id,
      db_status: f.validapay_onboarding_status,
      db_account: f.validapay_account_number,
      endpoints: endpointResults,
    })
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
})
