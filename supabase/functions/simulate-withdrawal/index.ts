import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Segurança: só funciona em sandbox
  const baseUrl = Deno.env.get('VALIDAPAY_BASE_URL') ?? ''
  if (!baseUrl.includes('sandbox')) {
    return json({ error: 'Rota disponível apenas em ambiente sandbox' }, 403)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autorizado' }, 401)

    const { data: { user }, error: authError } = await createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser()

    if (authError || !user) return json({ error: 'Não autorizado' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verifica que é freelancer
    const { data: profile } = await supabase.from('profiles').select('tipo').eq('id', user.id).single()
    if (profile?.tipo !== 'freelancer') {
      return json({ error: 'Acesso negado' }, 403)
    }

    // Busca as transações liberadas do freelancer
    const { data: freelancer } = await supabase
      .from('freelancers').select('id').eq('profile_id', user.id).single()
    if (!freelancer) return json({ error: 'Freelancer não encontrado' }, 404)

    const { data: applications } = await supabase
      .from('applications').select('id').eq('freelancer_id', freelancer.id)

    if (!applications?.length) return json({ error: 'Nenhuma transação disponível' }, 422)

    const { data: txs } = await supabase
      .from('transactions')
      .select('id, valor_liquido')
      .in('application_id', applications.map(a => a.id))
      .eq('status', 'liberado')

    if (!txs?.length) return json({ error: 'Saldo disponível para saque é zero' }, 422)

    // Marca como sacado via service role (bypassa RLS)
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ status: 'sacado' })
      .in('id', txs.map(t => t.id))

    if (updateError) {
      console.error('[simulate-withdrawal] Erro ao atualizar:', updateError)
      return json({ error: 'Erro ao simular saque' }, 500)
    }

    const total = txs.reduce((acc, t) => acc + Number(t.valor_liquido), 0)
    console.log(`[simulate-withdrawal] Saque simulado — R$${total}`)
    return json({ success: true, amount: total })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[simulate-withdrawal] Erro:', message)
    return json({ error: message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
