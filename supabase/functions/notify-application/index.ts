import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function emailAprovado(nome: string, jobTitulo: string, companyNome: string): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
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
                        <div style="margin:0 auto 24px;padding:0;width:56px;height:56px;background-color:#E6F7EE;border-radius:999px;display:flex;align-items:center;justify-content:center">
                          <p style="margin:0;padding:0">✅</p>
                        </div>
                        <h2 style="margin:0 0 16px;padding:0;font-size:20px;font-weight:700;color:#1A1A1A;letter-spacing:-0.3px">
                          Parabéns, ${nome}!
                        </h2>
                        <p style="margin:0 0 24px;padding:0;font-size:15px;line-height:1.6;color:#444444">
                          Você foi <strong>aprovado</strong> para a vaga
                        </p>
                        <div style="margin:0 0 32px;padding:16px 20px;background-color:#F4F4F4;border-radius:10px;text-align:left">
                          <p style="margin:0 0 4px;padding:0;font-size:13px;color:#6B6B6B;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Vaga</p>
                          <p style="margin:0 0 12px;padding:0;font-size:16px;font-weight:700;color:#1A1A1A">${jobTitulo}</p>
                          <p style="margin:0 0 4px;padding:0;font-size:13px;color:#6B6B6B;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Empresa</p>
                          <p style="margin:0;padding:0;font-size:15px;font-weight:600;color:#1A1A1A">${companyNome}</p>
                        </div>
                        <p style="margin:0 0 32px;padding:0;font-size:15px;line-height:1.6;color:#444444">
                          A empresa entrará em contato com você em breve. Fique atento ao seu celular!
                        </p>
                        <p style="margin:0;padding:0;font-size:13px;color:#999999">Bom trabalho! — Equipe QueroExtra</p>
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

function emailRejeitado(nome: string, jobTitulo: string, companyNome: string): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
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
                        <h2 style="margin:0 0 16px;padding:0;font-size:20px;font-weight:700;color:#1A1A1A;letter-spacing:-0.3px">
                          Olá, ${nome}
                        </h2>
                        <p style="margin:0 0 24px;padding:0;font-size:15px;line-height:1.6;color:#444444">
                          Agradecemos seu interesse na vaga
                        </p>
                        <div style="margin:0 0 32px;padding:16px 20px;background-color:#F4F4F4;border-radius:10px;text-align:left">
                          <p style="margin:0 0 4px;padding:0;font-size:13px;color:#6B6B6B;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Vaga</p>
                          <p style="margin:0 0 12px;padding:0;font-size:16px;font-weight:700;color:#1A1A1A">${jobTitulo}</p>
                          <p style="margin:0 0 4px;padding:0;font-size:13px;color:#6B6B6B;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Empresa</p>
                          <p style="margin:0;padding:0;font-size:15px;font-weight:600;color:#1A1A1A">${companyNome}</p>
                        </div>
                        <p style="margin:0 0 32px;padding:0;font-size:15px;line-height:1.6;color:#444444">
                          Desta vez a empresa optou por outro profissional. Não desanime — novas oportunidades aparecem todo dia no QueroExtra!
                        </p>
                        <p style="margin:0;padding:0;font-size:13px;color:#999999">Continue explorando — Equipe QueroExtra</p>
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { application_id, action } = await req.json()

    if (!application_id || !['aprovado', 'rejeitado'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'application_id e action (aprovado|rejeitado) são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'Quero Extra <noreply@queroextra.com>'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        job_id,
        freelancer_id,
        jobs(
          titulo,
          companies(
            profiles(nome)
          )
        ),
        freelancers(
          profile_id,
          profiles(id, nome, email)
        )
      `)
      .eq('id', application_id)
      .single()

    if (appError || !application) {
      return new Response(
        JSON.stringify({ error: 'Candidatura não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const freelancerProfile = (application.freelancers as any)?.profiles
    const jobTitulo         = (application.jobs as any)?.titulo ?? 'vaga'
    const companyNome       = (application.jobs as any)?.companies?.profiles?.nome ?? 'empresa'
    const nome              = freelancerProfile?.nome ?? 'Prestador'

    // Notificação in-app
    if (freelancerProfile?.id) {
      await supabase.from('notifications').insert({
        user_id: freelancerProfile.id,
        titulo: action === 'aprovado' ? 'Candidatura aprovada!' : 'Candidatura não selecionada',
        mensagem:
          action === 'aprovado'
            ? `Você foi aprovado para a vaga "${jobTitulo}" em ${companyNome}. Aguarde o contato da empresa.`
            : `Sua candidatura para "${jobTitulo}" em ${companyNome} não foi selecionada desta vez.`,
      })
    }

    // E-mail via Resend com HTML hardcoded
    if (resendKey && freelancerProfile?.email) {
      const subject =
        action === 'aprovado'
          ? `✅ Candidatura aprovada — ${jobTitulo}`
          : `Resultado da sua candidatura — ${jobTitulo}`

      const html =
        action === 'aprovado'
          ? emailAprovado(nome, jobTitulo, companyNome)
          : emailRejeitado(nome, jobTitulo, companyNome)

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [freelancerProfile.email],
          subject,
          html,
        }),
      })

      if (!emailRes.ok) {
        const body = await emailRes.text()
        console.error(`[notify-application] Resend error: ${body}`)
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
