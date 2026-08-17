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

    // Service role para buscar e atualizar dados
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verifica se o usuário tem o tipo freelancer
    const { data: profile } = await supabase
      .from('profiles')
      .select('tipo')
      .eq('id', user.id)
      .single()

    if (profile?.tipo !== 'freelancer') {
      return json({ error: 'Acesso negado: apenas freelancers podem solicitar saques' }, 403)
    }

    // Busca o freelancer vinculado ao usuário autenticado
    const { data: freelancer } = await supabase
      .from('freelancers')
      .select('id, cpf, pix_key, pix_key_type, validapay_account_number')
      .eq('profile_id', user.id)
      .single()

    if (!freelancer) return json({ error: 'Perfil de freelancer não encontrado' }, 404)

    // Validações básicas da conta Valida Pay e Chave PIX
    if (!freelancer.validapay_account_number) {
      return json({ error: 'Você não possui uma conta de pagamentos configurada' }, 422)
    }

    if (!freelancer.pix_key || !freelancer.pix_key_type || !freelancer.cpf) {
      return json({ error: 'Chave PIX ou CPF não configurados. Atualize suas informações de pagamento.' }, 422)
    }

    // Limpa o CPF apenas para os números, conforme esperado por algumas APIs
    const cleanCpf = freelancer.cpf.replace(/\D/g, '')

    // Buscar aplicações do freelancer
    const { data: applications } = await supabase
      .from('applications')
      .select('id')
      .eq('freelancer_id', freelancer.id)

    if (!applications || applications.length === 0) {
      return json({ error: 'Nenhuma transação disponível para saque' }, 422)
    }

    const applicationIds = applications.map(app => app.id)

    // Buscar transações com status liberado — mais antigas primeiro, pois
    // vamos consumi-las em ordem (FIFO) pra cobrir o valor solicitado.
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id, valor_liquido')
      .in('application_id', applicationIds)
      .eq('status', 'liberado')
      .order('created_at', { ascending: true })

    if (!transactions || transactions.length === 0) {
      return json({ error: 'Saldo disponível para saque é zero' }, 422)
    }

    const totalAvailable = transactions.reduce((acc, tx) => acc + Number(tx.valor_liquido), 0)

    // Lê o amount do body (opcional — se não informado, saca tudo)
    let requestedAmount = totalAvailable
    try {
      const body = await req.json().catch(() => ({}))
      if (body?.amount && typeof body.amount === 'number' && body.amount > 0) {
        requestedAmount = body.amount
      }
    } catch { /* body vazio — usa totalAvailable */ }

    if (requestedAmount > totalAvailable) {
      return json({ error: 'O valor solicitado é maior que o saldo disponível' }, 422)
    }

    // Cada transação representa o pagamento de um turno específico — não dá
    // pra sacar "metade" de uma. Consome transações inteiras (mais antigas
    // primeiro) até cobrir o valor pedido; o total final pode ficar um pouco
    // acima do solicitado se não bater exatamente com a soma disponível, mas
    // nunca fica abaixo, e a ValidaPay só recebe o valor das transações que
    // de fato vamos marcar como sacadas — sem essa correspondência exata,
    // um saque parcial acabava marcando TODAS as transações liberadas como
    // sacadas mesmo transferindo só uma fração do valor.
    const selected: typeof transactions = []
    let totalAmount = 0
    for (const tx of transactions) {
      if (totalAmount >= requestedAmount) break
      selected.push(tx)
      totalAmount += Number(tx.valor_liquido)
    }
    const transactionIds = selected.map(tx => tx.id)

    console.log(`[request-withdrawal] Solicitando saque de R$${totalAmount} para PIX ${freelancer.pix_key} (conta ${freelancer.validapay_account_number})`)

    // Reserva as transações ANTES de chamar a ValidaPay — só transiciona
    // quem ainda estiver 'liberado'. É uma trava otimista: se duas
    // solicitações concorrentes (duplo clique, retry de rede) tentarem
    // sacar o mesmo saldo, só uma consegue reservar todas as linhas: a
    // outra vê `reserved.length` menor que o esperado e aborta sem chamar
    // a ValidaPay, evitando saque duplicado do mesmo dinheiro.
    const { data: reserved, error: reserveError } = await supabase
      .from('transactions')
      .update({ status: 'sacado' })
      .in('id', transactionIds)
      .eq('status', 'liberado')
      .select('id')

    if (reserveError || !reserved || reserved.length !== transactionIds.length) {
      // Reverte o que conseguiu reservar (caso parcial) — não deixa nada
      // preso em 'sacado' sem ter de fato chamado a ValidaPay.
      if (reserved && reserved.length > 0) {
        await supabase.from('transactions').update({ status: 'liberado' }).in('id', reserved.map(r => r.id))
      }
      console.error('[request-withdrawal] Corrida detectada ao reservar transações para saque:', reserveError)
      return json({ error: 'Seu saldo mudou nesse instante — tente novamente' }, 409)
    }

    // Mapeia pixKeyType interno para o formato exigido pela Valida Pay (maiúsculo/inglês)
    const PIX_TYPE_MAP: Record<string, string> = {
      cpf: 'CPF', telefone: 'PHONE', email: 'EMAIL', chave_aleatoria: 'EVP',
    }
    const pixKeyTypeApi = PIX_TYPE_MAP[freelancer.pix_key_type] ?? freelancer.pix_key_type.toUpperCase()

    // Chama a Valida Pay para efetuar o saque (transferência do saldo da subconta para o PIX do titular)
    const res = await validaPayFetch('/v1/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({
        amount: totalAmount,
        pixKey: freelancer.pix_key,
        pixKeyType: pixKeyTypeApi,
        documentNumber: cleanCpf,
        accountId: freelancer.validapay_account_number,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[request-withdrawal] ValidaPay error:', errText)
      // O saque real nunca aconteceu — reverte a reserva pra 'liberado' pra
      // não deixar o freelancer sem acesso a um dinheiro que não foi pago.
      await supabase.from('transactions').update({ status: 'liberado' }).in('id', transactionIds)
      return json({ error: `Erro ao solicitar saque na instituição parceira.` }, 502)
    }

    const withdrawalData = await res.json()

    // As transações já foram marcadas 'sacado' na reserva acima — nada mais
    // a atualizar aqui, o que elimina a janela em que o saque real já tinha
    // sido efetuado mas o banco local ainda achava o saldo 'liberado'
    // (permitindo saque duplicado do mesmo dinheiro).
    return json({
      success: true,
      message: 'Saque solicitado com sucesso!',
      withdrawalId: withdrawalData.withdrawalId,
      amount: totalAmount
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[request-withdrawal] Erro:', message)
    return json({ error: message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
