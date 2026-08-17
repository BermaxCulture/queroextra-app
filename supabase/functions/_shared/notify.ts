// Dispara a notify-application (e-mail + in-app) a partir do backend — usado
// pelos dois caminhos que podem confirmar um pagamento (webhook e polling via
// get-charge-status), cada um só chamando isso quando é ele quem de fato
// transiciona a transação de 'pendente' pra 'retido' (evita notificação duplicada).
export async function notifyApplication(applicationId: string, action: 'aprovado' | 'rejeitado') {
  try {
    const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-application`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
      },
      body: JSON.stringify({ application_id: applicationId, action }),
    })
    if (!res.ok) {
      console.error('[notifyApplication] notify-application falhou:', await res.text())
    }
  } catch (e) {
    console.error('[notifyApplication] Erro ao chamar notify-application:', e)
  }
}
