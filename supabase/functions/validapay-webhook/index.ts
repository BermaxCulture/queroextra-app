import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Usando Service Role para ignorar RLS no webhook
    )

    const payload = await req.json()
    console.log('Webhook recebido da ValidaPay:', JSON.stringify(payload, null, 2))

    // 1. Aprovação de Subconta (account_approved)
    if (payload.event === 'account_approved' && payload.status === 'CONFIRMED') {
      const formId = payload.formId
      const accountNumber = payload.account?.account

      if (!formId || !accountNumber) {
        throw new Error('Payload inválido: formId ou account.account ausente')
      }

      // Atualiza o freelancer correspondente
      const { data, error } = await supabaseClient
        .from('freelancers')
        .update({
          validapay_onboarding_status: 'aprovado',
          validapay_account_number: accountNumber
        })
        .eq('validapay_form_id', formId)
        .select()

      if (error) {
        console.error('Erro ao atualizar freelancer:', error)
        throw error
      }

      console.log(`Freelancer aprovado! formId: ${formId}, Conta: ${accountNumber}`)
      
      return new Response(JSON.stringify({ message: 'Webhook account_approved processado com sucesso' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 2. Confirmação de Pagamento PIX (charge.paid)
    if (payload.event === 'charge.paid' || (payload.event === 'charge.updated' && payload.status === 'PAID')) {
      const chargeId = payload.chargeId || payload.id

      if (!chargeId) {
        throw new Error('Payload inválido: chargeId ausente')
      }

      // Atualiza a transação para retido
      const { data: txData, error: txError } = await supabaseClient
        .from('transactions')
        .update({ status: 'retido' })
        .eq('gateway_charge_id', chargeId)
        .select('application_id')
        .single()

      if (txError) {
        console.error('Erro ao atualizar transação para retido:', txError)
        throw txError
      }

      // Atualiza a candidatura para aprovado
      if (txData && txData.application_id) {
        const { error: appError } = await supabaseClient
          .from('applications')
          .update({ status: 'aprovado' })
          .eq('id', txData.application_id)

        if (appError) {
          console.error('Erro ao atualizar candidatura para aprovado:', appError)
        }
      }

      console.log(`Pagamento confirmado! chargeId: ${chargeId}`)

      return new Response(JSON.stringify({ message: 'Webhook charge.paid processado com sucesso' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    // 3. Recebimento de Link de Documentos (onboarding.documentscopy)
    if (payload.event === 'onboarding.documentscopy' && payload.data?.status === 'PENDING') {
      const url = payload.data.url
      const formId = payload.data.proposalId

      if (url && formId) {
        const { error } = await supabaseClient
          .from('freelancers')
          .update({ validapay_url_documentscopy: url })
          .eq('validapay_form_id', formId)

        if (error) {
          console.error('Erro ao salvar URL de documentos:', error)
          throw error
        }
        console.log(`URL de documentos salva para formId: ${formId}`)
        return new Response(JSON.stringify({ message: 'Webhook documentscopy processado com sucesso' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
    }

    // 4. Conta Criada (payload final sem event)
    if (!payload.event && payload.formId && payload.accountNumber) {
      const formId = payload.formId
      const accountNumber = payload.accountNumber

      const { error } = await supabaseClient
        .from('freelancers')
        .update({
          validapay_onboarding_status: 'aprovado',
          validapay_account_number: accountNumber
        })
        .eq('validapay_form_id', formId)

      if (error) {
        console.error('Erro ao aprovar conta final:', error)
        throw error
      }
      
      console.log(`Conta final aprovada! formId: ${formId}, Conta: ${accountNumber}`)
      return new Response(JSON.stringify({ message: 'Webhook de conta criada processado com sucesso' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    // Retorno padrão para eventos não mapeados ou não suportados ainda
    return new Response(JSON.stringify({ message: 'Evento recebido, mas nenhuma ação mapeada foi executada' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro no webhook:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
