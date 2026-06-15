import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { validaPayFetch } from '../_shared/validapay.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { application_id } = await req.json()
    if (!application_id) {
      throw new Error('application_id é obrigatório')
    }

    // Busca a candidatura, o valor da vaga e a conta do freelancer
    const { data: application, error: appError } = await supabaseClient
      .from('applications')
      .select(`
        id,
        jobs ( id, valor ),
        freelancers ( id, validapay_account_number, validapay_onboarding_status )
      `)
      .eq('id', application_id)
      .single()

    if (appError || !application) {
      throw new Error('Candidatura não encontrada')
    }

    const job = application.jobs
    const freelancer = application.freelancers

    if (freelancer.validapay_onboarding_status !== 'aprovado' || !freelancer.validapay_account_number) {
      throw new Error('Freelancer não possui conta Valida Pay aprovada')
    }

    const valorBruto = Number(job.valor)
    const taxaPlataforma = 10.0 // R$ 10
    const valorLiquido = valorBruto - taxaPlataforma

    if (valorLiquido <= 0) {
      throw new Error('Valor da vaga é menor ou igual à taxa da plataforma')
    }

    // Gera a cobrança na Valida Pay
    const res = await validaPayFetch('/v1/charges/pix', {
      method: 'POST',
      body: JSON.stringify({
        amount: valorBruto,
        split: [
          {
            type: 'fixed',
            accountNumber: freelancer.validapay_account_number,
            amount: valorLiquido
          }
        ],
        metadata: {
          applicationId: application_id,
          jobId: job.id,
          freelancerId: freelancer.id
        }
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Erro ao gerar PIX Valida Pay: ${errText}`)
    }

    const chargeData = await res.json()
    // { chargeId, emv }

    // Salva a transação como pendente no banco
    const { error: txError } = await supabaseClient
      .from('transactions')
      .insert({
        job_id: job.id,
        application_id: application_id,
        valor_bruto: valorBruto,
        taxa_plataforma: taxaPlataforma,
        valor_liquido: valorLiquido,
        gateway_charge_id: chargeData.chargeId,
        emv: chargeData.emv,
        status: 'pendente'
      })

    if (txError) {
      console.error('Erro ao salvar transação:', txError)
      // Não quebra a requisição se falhar ao salvar, pois a cobrança já foi gerada na Valida Pay.
      // O ideal seria usar uma RPC com transaction, mas para o MVP isso serve.
    }

    return new Response(JSON.stringify(chargeData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro em create-pix-charge:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
