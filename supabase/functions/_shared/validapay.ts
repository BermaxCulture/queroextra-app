// Cache de token em nível de módulo — persiste enquanto o isolate Deno estiver aquecido
let cachedToken: string | null = null
let tokenExpiresAt = 0

export async function getValidaPayToken(): Promise<string> {
  // Reutiliza token se ainda válido (com 60s de margem)
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken
  }

  const authUrl = Deno.env.get('VALIDAPAY_AUTH_URL')
  const clientId = Deno.env.get('VALIDAPAY_CLIENT_ID')
  const clientSecret = Deno.env.get('VALIDAPAY_CLIENT_SECRET')

  if (!authUrl || !clientId || !clientSecret) {
    throw new Error('Variáveis de ambiente da ValidaPay não configuradas (VALIDAPAY_AUTH_URL, VALIDAPAY_CLIENT_ID, VALIDAPAY_CLIENT_SECRET)')
  }

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

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`ValidaPay auth falhou: ${res.status} — ${text}`)
  }

  const data = await res.json()
  cachedToken = data.access_token
  tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000

  return cachedToken!
}

export async function validaPayFetch(
  path: string,
  options: RequestInit = {},
  subAccountNumber?: string
): Promise<Response> {
  const baseUrl = Deno.env.get('VALIDAPAY_BASE_URL')
  if (!baseUrl) {
    throw new Error('VALIDAPAY_BASE_URL não configurada')
  }

  const token = await getValidaPayToken()

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  }

  if (subAccountNumber) {
    headers['X-Sub-Account'] = subAccountNumber
  }

  return fetch(`${baseUrl}${path}`, { ...options, headers })
}
