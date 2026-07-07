import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    let chargeId = ''
    if (req.method === 'POST') {
      const body = await req.json()
      chargeId = body.chargeId
    } else {
      const url = new URL(req.url)
      chargeId = url.searchParams.get('chargeId') || ''
    }

    if (!chargeId) {
      throw new Error('chargeId é obrigatório')
    }

    const res = await validaPayFetch(`/v1/charges/${chargeId}`)
    
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Erro ao consultar status na Valida Pay: ${errText}`)
    }

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro em get-charge-status:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
