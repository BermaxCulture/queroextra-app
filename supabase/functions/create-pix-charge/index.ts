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
      .select('tipo, email, celular')
      .eq('id', user.id)
      .single()

    if (profile?.tipo !== 'empresa') {
      return json({ error: 'Acesso negado: somente empresas podem gerar cobranças' }, 403)
    }

    // V-04: Busca a empresa vinculada ao usuário autenticado
    const { data: company } = await supabase
      .from('companies')
      .select('id, is_test_account, cnpj_cpf')
      .eq('profile_id', user.id)
      .single()

    if (!company) return json({ error: 'Empresa não encontrada' }, 404)

    // A ValidaPay exige o objeto `customer` (documentNumber/e-mail no mínimo)
    // apesar da doc marcar o campo como opcional — sem ele a cobrança falha
    // com 400 antes de gerar o PIX. CNPJ/CPF e e-mail são obrigatórios no
    // cadastro da empresa antes de gerar uma cobrança.
    if (!company.cnpj_cpf || !profile.email) {
      return json({ error: 'Complete o cadastro da empresa (CNPJ/CPF e e-mail) antes de gerar uma cobrança' }, 422)
    }

    const { application_id } = await req.json()
    if (!application_id) return json({ error: 'application_id é obrigatório' }, 400)

    // V-02: Idempotência — bloqueia double spend, mas sem travar o usuário
    // pra sempre. 'retido' significa que já foi paga de verdade: bloqueia.
    // 'pendente' pode ser uma cobrança abandonada (empresa fechou o modal
    // sem pagar) — consulta o status ao vivo na ValidaPay antes de decidir:
    // ainda pagável reaproveita o mesmo QR; expirada/cancelada libera pra
    // gerar uma nova.
    const { data: existing } = await supabase
      .from('transactions')
      .select('id, status, gateway_charge_id, emv')
      .eq('application_id', application_id)
      .in('status', ['pendente', 'retido'])
      .maybeSingle()

    if (existing) {
      if (existing.status === 'retido') {
        return json({ error: 'Esta candidatura já foi paga', code: 'CHARGE_EXISTS' }, 409)
      }

      if (existing.gateway_charge_id) {
        const liveRes = await validaPayFetch(`/v1/charges/${existing.gateway_charge_id}`)
        if (liveRes.ok) {
          const liveData = await liveRes.json()

          if (liveData.status === 'PAID') {
            // Já foi paga na ValidaPay mas o webhook/polling ainda não
            // refletiu isso no nosso banco — devolve o mesmo charge pro
            // frontend detectar o pagamento na próxima consulta de status.
            return json({ chargeId: existing.gateway_charge_id, emv: existing.emv })
          }

          if (liveData.status === 'PENDING' && existing.emv) {
            // Ainda pagável — reaproveita o QR já gerado em vez de criar
            // outra cobrança live pro mesmo turno.
            return json({ chargeId: existing.gateway_charge_id, emv: existing.emv })
          }

          // EXPIRED/CANCELLED (ou emv ausente de um registro antigo) —
          // encerra a cobrança antiga e segue pra gerar uma nova.
          await supabase.from('transactions').update({ status: 'estornado' }).eq('id', existing.id)
        } else {
          console.error('[create-pix-charge] Falha ao consultar status ao vivo da cobrança existente:', await liveRes.text())
          return json({ error: 'Já existe uma cobrança ativa para esta candidatura', code: 'CHARGE_EXISTS' }, 409)
        }
      } else {
        await supabase.from('transactions').update({ status: 'estornado' }).eq('id', existing.id)
      }
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

    // A taxa fixa da plataforma é somada EM CIMA do valor da vaga: a empresa
    // paga valorVaga + taxaPlataforma, e o freelancer recebe o valor da vaga
    // cheio via split (a taxa não sai do freelancer). Empresas de teste
    // (companies.is_test_account) têm a taxa zerada — usam vagas de valor
    // baixo de verdade pra testar sem custo real pra plataforma.
    const valorVaga = Number(job.valor)
    const taxaPlataforma = company.is_test_account ? 0 : 10.0
    const valorCobranca = valorVaga + taxaPlataforma

    if (valorVaga <= 0) {
      return json({ error: 'Valor da vaga inválido' }, 422)
    }

    // customer.name NÃO é enviado de propósito: incluir `name` faz a ValidaPay
    // tratar a cobrança como COBV (vencimento), que passa a exigir também
    // `cep` do customer + `expiration` — e a maioria das empresas não tem CEP
    // cadastrado. Sem `name`, a cobrança fica no modo "imediato" simples e
    // documentNumber + email já bastam (confirmado testando a API real).
    const customer: Record<string, string> = {
      documentNumber: company.cnpj_cpf.replace(/\D/g, ''),
      email: profile.email,
    }
    if (profile.celular) customer.phone = formatPhone(profile.celular)

    // Endpoint dedicado de "cobrança imediata com split": cria o QR Code na
    // conta master da plataforma e faz o split pra conta ValidaPay do
    // freelancer. O endpoint genérico /v1/charges aceitava accountNumber de
    // split inválido sem erro nenhum (split silenciosamente não aplicado);
    // este valida de verdade e rejeita split pra conta inexistente.
    const res = await validaPayFetch('/v1/charges/pix', {
      method: 'POST',
      body: JSON.stringify({
        amount: valorCobranca,
        title: `Pagamento - ${job.titulo}`,
        customer,
        split: [
          {
            type: 'fixed',
            accountNumber: freelancer.validapay_account_number,
            amount: valorVaga,
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
    const emv = chargeData.emv

    if (!emv) {
      console.error('[create-pix-charge] Resposta sem EMV:', JSON.stringify(chargeData))
      return json({ error: 'ValidaPay não retornou o código PIX (emv)' }, 502)
    }

    // Salva a transação como pendente. valor_bruto = total cobrado da
    // empresa; valor_liquido = o que o freelancer recebe (valor cheio da
    // vaga); valor_bruto - taxa_plataforma = valor_liquido.
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        job_id: job.id,
        application_id,
        valor_bruto: valorCobranca,
        taxa_plataforma: taxaPlataforma,
        valor_liquido: valorVaga,
        gateway_charge_id: chargeData.chargeId,
        emv,
        status: 'pendente',
        is_test: company.is_test_account === true,
      })

    if (txError) {
      console.error('[create-pix-charge] Erro ao salvar transação:', txError)
    }

    return json({ chargeId: chargeData.chargeId, emv })
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

function formatPhone(celular: string): string {
  const digits = celular.replace(/\D/g, '')
  if (digits.startsWith('55')) return `+${digits}`
  return `+55${digits}`
}
