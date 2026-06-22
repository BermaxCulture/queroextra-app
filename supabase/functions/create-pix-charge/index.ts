import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validaPayFetch } from '../_shared/validapay.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth: identifica o usuário via JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autorizado' }, 401)

    const { data: { user }, error: authError } = await createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser()

    if (authError || !user) return json({ error: 'Não autorizado' }, 401)

    // Service role para todas as queries do banco — garante acesso sem RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // V-03: Somente empresas podem gerar cobranças
    const { data: profile } = await supabase
      .from('profiles')
      .select('tipo')
      .eq('id', user.id)
      .single()

    if (profile?.tipo !== 'empresa') {
      return json({ error: 'Acesso negado: somente empresas podem gerar cobranças' }, 403)
    }

    // V-04: Busca a empresa vinculada ao usuário autenticado
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    if (!company) return json({ error: 'Empresa não encontrada' }, 404)

    const { application_id } = await req.json()
    if (!application_id) return json({ error: 'application_id é obrigatório' }, 400)

    // V-02: Idempotência — bloqueia double spend
    const { data: existing } = await supabase
      .from('transactions')
      .select('id, status')
      .eq('application_id', application_id)
      .in('status', ['pendente', 'retido'])
      .maybeSingle()

    if (existing) {
      return json({ error: 'Já existe uma cobrança ativa para esta candidatura', code: 'CHARGE_EXISTS' }, 409)
    }

    // Busca candidatura com vaga e freelancer
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        id, status,
        jobs ( id, titulo, valor, company_id ),
        freelancers ( id, validapay_account_number, validapay_onboarding_status )
      `)
      .eq('id', application_id)
      .single()

    if (appError || !application) return json({ error: 'Candidatura não encontrada' }, 404)

    const job = application.jobs as any
    const freelancer = application.freelancers as any

    // V-04: Verifica que a vaga pertence à empresa autenticada
    if (job.company_id !== company.id) {
      return json({ error: 'Acesso negado: esta candidatura não pertence à sua empresa' }, 403)
    }

    // Valida que o freelancer tem subconta aprovada
    if (freelancer.validapay_onboarding_status !== 'aprovado' || !freelancer.validapay_account_number) {
      return json({ error: 'Freelancer não possui conta Valida Pay aprovada' }, 422)
    }

    const valorBruto = Number(job.valor)
    const taxaPlataforma = 10.0
    const valorLiquido = valorBruto - taxaPlataforma

    if (valorLiquido <= 0) {
      return json({ error: 'Valor da vaga é menor ou igual à taxa da plataforma' }, 422)
    }

    // NC-05: Endpoint correto — POST /v1/charges com paymentMethod: 'pix'
    // NC-06: Campo title obrigatório adicionado
    const res = await validaPayFetch('/v1/charges', {
      method: 'POST',
      body: JSON.stringify({
        paymentMethod: 'pix',
        amount: valorBruto,
        title: `Pagamento - ${job.titulo}`,
        split: [
          {
            type: 'fixed',
            accountNumber: freelancer.validapay_account_number,
            amount: valorLiquido,
          },
        ],
        metadata: {
          applicationId: application_id,
          jobId: job.id,
          freelancerId: freelancer.id,
        },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[create-pix-charge] ValidaPay error:', errText)
      return json({ error: `Erro ao gerar PIX: ${errText}` }, 502)
    }

    const chargeData = await res.json()

    // Salva a transação como pendente
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        job_id: job.id,
        application_id,
        valor_bruto: valorBruto,
        taxa_plataforma: taxaPlataforma,
        valor_liquido: valorLiquido,
        gateway_charge_id: chargeData.chargeId,
        emv: chargeData.emv,
        status: 'pendente',
      })

    if (txError) {
      console.error('[create-pix-charge] Erro ao salvar transação:', txError)
    }

    return json({ chargeId: chargeData.chargeId, emv: chargeData.emv })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[create-pix-charge] Erro:', message)
    return json({ error: message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
