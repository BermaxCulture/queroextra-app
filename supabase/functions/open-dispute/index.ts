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
    // Auth: identifica o usuário via JWT — empresa ou freelancer, ambos podem abrir disputa
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autorizado' }, 401)

    const { data: { user }, error: authError } = await createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser()

    if (authError || !user) return json({ error: 'Não autorizado' }, 401)

    const { transaction_id, motivo } = await req.json()
    if (!transaction_id || !motivo || !String(motivo).trim()) {
      return json({ error: 'transaction_id e motivo são obrigatórios' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select(`
        id, status, em_disputa,
        jobs ( titulo, companies ( profile_id, profiles ( nome, email ) ) ),
        applications ( freelancers ( profile_id, profiles ( nome, email ) ) )
      `)
      .eq('id', transaction_id)
      .single()

    if (txError || !tx) return json({ error: 'Transação não encontrada' }, 404)

    const job = tx.jobs as any
    const application = tx.applications as any
    const companyProfileId = job?.companies?.profile_id
    const freelancerProfileId = application?.freelancers?.profile_id

    const isCompany = companyProfileId === user.id
    const isFreelancer = freelancerProfileId === user.id

    if (!isCompany && !isFreelancer) {
      return json({ error: 'Acesso negado: esta transação não pertence a você' }, 403)
    }

    if (tx.em_disputa) {
      return json({ error: 'Já existe uma disputa em aberto para essa transação' }, 409)
    }

    // Só cobranças pagas (retido) ou já liberadas fazem sentido disputar —
    // pendente ainda nem foi paga, sacado/estornado já são estado terminal (a
    // ValidaPay já valida a titularidade da chave PIX no saque).
    if (!['retido', 'liberado'].includes(tx.status as string)) {
      return json({ error: 'Essa transação não pode ser disputada nesse status' }, 422)
    }

    // Só abre se ainda estiver false — trava otimista contra corrida de duplo clique
    const { data: updated, error: updateError } = await supabase
      .from('transactions')
      .update({
        em_disputa: true,
        motivo_disputa: String(motivo).trim(),
        disputa_aberta_por: user.id,
        disputa_aberta_em: new Date().toISOString(),
      })
      .eq('id', transaction_id)
      .eq('em_disputa', false)
      .select('id')
      .maybeSingle()

    if (updateError) {
      console.error('[open-dispute] Erro ao abrir disputa:', updateError)
      return json({ error: 'Erro ao registrar a disputa' }, 500)
    }
    if (!updated) {
      return json({ error: 'Já existe uma disputa em aberto para essa transação' }, 409)
    }

    // Notifica o suporte por e-mail — melhor esforço, não bloqueia a resposta.
    // Requer o secret SUPPORT_EMAIL configurado no projeto Supabase.
    const supportEmail = Deno.env.get('SUPPORT_EMAIL')
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (supportEmail && resendKey) {
      const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'Quero Extra <noreply@queroextra.com>'
      const abertoPor = isCompany ? 'empresa' : 'freelancer'
      const nomeAbriu = isCompany ? job?.companies?.profiles?.nome : application?.freelancers?.profiles?.nome
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: fromEmail,
            to: [supportEmail],
            subject: `⚠️ Nova disputa — ${job?.titulo ?? 'vaga'}`,
            html: `<p><strong>${nomeAbriu ?? 'Usuário'}</strong> (${abertoPor}) abriu uma disputa.</p>
                   <p><strong>Vaga:</strong> ${job?.titulo ?? '—'}</p>
                   <p><strong>Transação:</strong> ${transaction_id}</p>
                   <p><strong>Motivo:</strong> ${String(motivo).trim()}</p>
                   <p>Resolva no painel administrativo — Finanças → Disputas.</p>`,
          }),
        })
        if (!res.ok) console.error('[open-dispute] Resend error:', await res.text())
      } catch (e) {
        console.error('[open-dispute] Falha ao notificar suporte:', e)
      }
    } else {
      console.warn('[open-dispute] SUPPORT_EMAIL não configurado — disputa registrada sem notificação por e-mail')
    }

    return json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[open-dispute] Erro:', message)
    return json({ error: message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
