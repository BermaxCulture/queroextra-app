// Cache de tokens em nível de módulo — persiste enquanto o isolate Deno estiver aquecido
const cachedTokens: Record<string, { token: string; expiresAt: number }> = {}

export async function getValidaPayToken(scope: string): Promise<string> {
  // Reutiliza token se ainda válido (com 60s de margem)
  if (cachedTokens[scope] && Date.now() < cachedTokens[scope].expiresAt - 60_000) {
    return cachedTokens[scope].token
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
      scope,
    }).toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`ValidaPay auth falhou (${res.status}): ${text}`)
  }

  const data = await res.json()
  cachedTokens[scope] = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  }

  return cachedTokens[scope].token
}

export async function validaPayFetch(
  path: string,
  options: RequestInit = {},
  subAccountNumber?: string,
  scope: string = 'proposals/write'
): Promise<Response> {
  const baseUrl = Deno.env.get('VALIDAPAY_BASE_URL')
  if (!baseUrl) {
    throw new Error('VALIDAPAY_BASE_URL não configurada')
  }

  const token = await getValidaPayToken(scope)

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
