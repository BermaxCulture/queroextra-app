import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const jobTitulo = (application.jobs as any)?.titulo ?? 'vaga'
    const companyNome = (application.jobs as any)?.companies?.profiles?.nome ?? 'empresa'

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

    // E-mail via Resend (templates do dashboard)
    if (resendKey && freelancerProfile?.email) {
      const TEMPLATE_APROVADO  = '55b0380d-bab9-4065-b402-78ab10a733c1'
      const TEMPLATE_REJEITADO = 'd7b73001-c164-442e-a600-77133879545c'

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [freelancerProfile.email],
          template_id: action === 'aprovado' ? TEMPLATE_APROVADO : TEMPLATE_REJEITADO,
          variables: {
            nome:        freelancerProfile.nome,
            jobTitulo:   jobTitulo,
            companyNome: companyNome,
          },
        }),
      })

      if (!emailRes.ok) {
        const body = await emailRes.text()
        console.error(`[notify-application] Resend error: ${body}`)
        // Falha no e-mail não interrompe o fluxo — notificação in-app já foi criada
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
