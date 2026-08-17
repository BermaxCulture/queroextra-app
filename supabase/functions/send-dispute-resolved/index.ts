const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mesmo estilo visual dos outros e-mails do projeto (ver validapay-webhook/index.ts)
function emailLayout(opts: { emoji: string; title: string; body: string }): string {
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
                          <p style="margin:0;padding:0;font-size:24px;line-height:56px">${opts.emoji}</p>
                        </div>
                        <h2 style="margin:0 0 16px;padding:0;font-size:20px;font-weight:700;color:#1A1A1A;letter-spacing:-0.3px">
                          ${opts.title}
                        </h2>
                        <p style="margin:0;padding:0;font-size:15px;line-height:1.6;color:#444444;text-align:left">
                          ${opts.body}
                        </p>
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

async function sendEmail(to: string, subject: string, html: string) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'Quero Extra <noreply@queroextra.com>'
  if (!resendKey) return

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromEmail, to: [to], subject, html }),
    })
    if (!res.ok) {
      console.error('[send-dispute-resolved] Resend error:', await res.text())
    }
  } catch (e) {
    console.error('[send-dispute-resolved] Falha ao enviar e-mail:', e)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { titulo, decisao, observacao, empresa_email, freelancer_email } = await req.json()

    if (!decisao || !['estornado', 'liberado', 'sem_acao'].includes(decisao)) {
      return json({ error: 'decisao inválida' }, 400)
    }

    const vaga = titulo ?? 'sua vaga'
    const nota = observacao ? `<br><br><em>Observação da equipe: ${observacao}</em>` : ''

    if (empresa_email) {
      const empresaContent = {
        estornado: {
          subject: '✅ Reembolso confirmado',
          emoji: '✅',
          title: 'Seu pagamento foi estornado',
          body: `Analisamos a disputa referente à vaga <strong>${vaga}</strong> e confirmamos o estorno do valor pago. O reembolso é processado pela ValidaPay e deve cair na sua conta em breve.${nota}`,
        },
        liberado: {
          subject: 'Disputa resolvida',
          emoji: 'ℹ️',
          title: 'Sua disputa foi resolvida',
          body: `Analisamos a disputa referente à vaga <strong>${vaga}</strong> e decidimos manter o pagamento ao freelancer — o trabalho foi considerado válido.${nota}`,
        },
        sem_acao: {
          subject: 'Disputa analisada',
          emoji: 'ℹ️',
          title: 'Sua disputa foi analisada',
          body: `Analisamos a disputa referente à vaga <strong>${vaga}</strong>. Não há alteração a fazer no pagamento nesse caso.${nota}`,
        },
      }[decisao as 'estornado' | 'liberado' | 'sem_acao']

      await sendEmail(empresa_email, empresaContent.subject, emailLayout(empresaContent))
    }

    if (freelancer_email) {
      const freelancerContent = {
        estornado: {
          subject: 'Disputa resolvida',
          emoji: 'ℹ️',
          title: 'Sua disputa foi resolvida',
          body: `Analisamos a disputa referente à vaga <strong>${vaga}</strong> e o pagamento foi estornado para a empresa.${nota}`,
        },
        liberado: {
          subject: '✅ Pagamento liberado',
          emoji: '✅',
          title: 'Seu pagamento foi liberado',
          body: `Analisamos a disputa referente à vaga <strong>${vaga}</strong> e confirmamos a liberação do seu pagamento — já pode sacar na sua Carteira.${nota}`,
        },
        sem_acao: {
          subject: 'Disputa analisada',
          emoji: 'ℹ️',
          title: 'Sua disputa foi analisada',
          body: `Analisamos a disputa referente à vaga <strong>${vaga}</strong>. Não há alteração a fazer no pagamento nesse caso.${nota}`,
        },
      }[decisao as 'estornado' | 'liberado' | 'sem_acao']

      await sendEmail(freelancer_email, freelancerContent.subject, emailLayout(freelancerContent))
    }

    return json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[send-dispute-resolved] Erro:', message)
    return json({ error: message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
