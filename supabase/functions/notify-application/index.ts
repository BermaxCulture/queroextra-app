import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function emailAprovado(nome: string, jobTitulo: string, companyNome: string): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1A1A1A">
      <h2 style="color:#1A1A1A;margin-bottom:8px">Parabéns, ${nome}! 🎉</h2>
      <p style="color:#444;line-height:1.6">
        Sua candidatura para a vaga <strong>${jobTitulo}</strong> na empresa
        <strong>${companyNome}</strong> foi <strong style="color:#1A9E5C">aprovada</strong>.
      </p>
      <p style="color:#444;line-height:1.6">
        A empresa entrará em contato com você em breve com mais detalhes sobre o turno.
        Fique atento ao seu celular!
      </p>
      <hr style="border:none;border-top:1px solid #E5E5E5;margin:24px 0"/>
      <p style="color:#999;font-size:13px">
        Quero Extra — A plataforma de trabalho extra para o food service.
      </p>
    </div>
  `
}

function emailRejeitado(nome: string, jobTitulo: string, companyNome: string): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1A1A1A">
      <h2 style="color:#1A1A1A;margin-bottom:8px">Olá, ${nome}</h2>
      <p style="color:#444;line-height:1.6">
        Infelizmente sua candidatura para a vaga <strong>${jobTitulo}</strong> na empresa
        <strong>${companyNome}</strong> não foi selecionada desta vez.
      </p>
      <p style="color:#444;line-height:1.6">
        Não desanime! Existem muitas outras oportunidades disponíveis na plataforma.
        Continue explorando e se candidatando às vagas que combinam com o seu perfil.
      </p>
      <hr style="border:none;border-top:1px solid #E5E5E5;margin:24px 0"/>
      <p style="color:#999;font-size:13px">
        Quero Extra — A plataforma de trabalho extra para o food service.
      </p>
    </div>
  `
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
