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
    const { profile_id } = await req.json()
    if (!profile_id) {
      return new Response(JSON.stringify({ error: 'profile_id obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    const adminEmail = Deno.env.get('ADMIN_NOTIFICATION_EMAIL')

    if (!resendKey || !adminEmail) {
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: 'Resend não configurado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, email')
      .eq('id', profile_id)
      .single()

    const { data: company } = await supabase
      .from('companies')
      .select('area, cnpj_cpf, status')
      .eq('profile_id', profile_id)
      .single()

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM_EMAIL') ?? 'Quero Extra <noreply@queroextra.com>',
        to: [adminEmail],
        subject: 'Nova empresa aguardando aprovação — Quero Extra',
        html: `
          <p>Uma nova empresa concluiu o cadastro e enviou documentos.</p>
          <ul>
            <li><strong>Nome:</strong> ${profile?.nome ?? '—'}</li>
            <li><strong>E-mail:</strong> ${profile?.email ?? '—'}</li>
            <li><strong>Área:</strong> ${company?.area ?? '—'}</li>
            <li><strong>CNPJ/CPF:</strong> ${company?.cnpj_cpf ?? '—'}</li>
            <li><strong>Status:</strong> ${company?.status ?? 'pendente'}</li>
          </ul>
          <p>Acesse o painel admin para revisar o cadastro.</p>
        `,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Resend error: ${body}`)
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
