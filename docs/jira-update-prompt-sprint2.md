# Prompt para Claude Desktop — Atualizar Jira Sprint 2

---

Preciso que você atualize algumas issues da Sprint 2 no meu Jira (projeto QueroExtra). Use as ferramentas MCP do Atlassian. As issues estão identificadas pelos códigos QUER-48, QUER-50 e QUER-53.

---

## Contexto da arquitetura (para entender o que mudar)

O QueroExtra usa a Valida Pay como gateway. Após análise da documentação da API, confirmamos que o modelo correto é:

- **Split na cobrança PIX**: ao aprovar candidato, a empresa paga → R$10 vai para a master do QueroExtra + valor líquido vai para a subconta do freelancer na Valida Pay
- **Escrow via subconta**: o dinheiro fica na subconta do freelancer, mas **só o master (QueroExtra) pode sacar dessa subconta** via `POST /v1/wallet/withdraw` com `accountId`. O freelancer não tem API credentials próprios.
- **Liberação no checkout**: quando o checkout é confirmado, um trigger no banco chama a Edge Function `release-payment`, que usa `wallet/withdraw` para enviar o valor da subconta para a chave PIX do freelancer → cai na conta bancária dele.

---

## Issues a atualizar

### QUER-48 — US-02: Onboarding do freelancer

**Mudança:** Adicionar que a chave PIX também é coletada durante o onboarding (no formulário de dados financeiros, etapa 2), e que ela é armazenada em `freelancers.pix_key` para ser usada no repasse pós-checkout.

**Adicionar ao final da descrição existente:**
```
Atualização (2026-06-15): A etapa 2 do formulário também coleta a chave PIX do freelancer 
(tipo + valor, com validação por regex no frontend e backend). 
Esta chave é armazenada em freelancers.pix_key e freelancers.pix_key_type, 
e será usada pela Edge Function release-payment no momento do checkout para 
chamar POST /v1/wallet/withdraw { accountId: subconta_freelancer, pixKey: pix_key }.

Migrations adicionais:
- freelancers: pix_key text, pix_key_type text CHECK IN ('cpf','telefone','email','chave_aleatoria')
```

---

### QUER-50 — US-03: Gerar cobrança PIX com split ao aprovar candidato

**Mudança:** Confirmar que o split acontece na criação da cobrança (não no checkout). Atualizar descrição para incluir detalhes de segurança e idempotência.

**Nova descrição completa:**
```
Como empresa, quero que ao aprovar um candidato seja gerada automaticamente uma cobrança PIX 
com split para que R$10 fique na master do QueroExtra (taxa) e o valor líquido vá para a 
subconta do freelancer na Valida Pay.

Edge Function create-pix-charge:
- Recebe { application_id } — único parâmetro aceito do frontend
- Empresa autenticada via JWT (auth.uid()) — todos os dados buscados do banco
- Validações: ownership da vaga, candidatura aprovada, freelancer com subconta aprovada 
  (validapay_account_number preenchido), idempotência (sem transaction ativa para este application_id)
- Gera idempotency_key antes de chamar a API
- Chama POST /v1/charges/pix com split:
  [
    { type: "fixed", amount: 10.00 },                          // master (taxa)
    { type: "fixed", accountNumber: validapay_account_number, amount: job.valor - 10 }  // subconta freelancer
  ]
- Header X-Idempotency-Key em todas as chamadas
- Cria transactions com status = 'retido', gateway_charge_id, emv, idempotency_key
- Retorna { chargeId, emv } para o frontend exibir o QR Code

Segurança: dados sensíveis sempre buscados do banco (nunca aceitos do body); 
ownership da vaga validada; idempotência via X-Idempotency-Key.

Migrations:
- transactions: application_id (FK), gateway_charge_id, emv, paid_at, idempotency_key, gateway_payment_id
```

---

### QUER-53 — US-06: Trigger: checkout confirmado libera saque na plataforma

**Mudança:** Esclarecer o mecanismo de liberação — não é apenas uma mudança de status no banco, é uma chamada real à API da Valida Pay para transferir o dinheiro da subconta do freelancer para a chave PIX dele.

**Nova descrição completa:**
```
Como plataforma, quero que ao confirmar o checkout o valor líquido seja transferido 
automaticamente da subconta do freelancer para a conta bancária dele via PIX.

Mecanismo:
1. Trigger trg_liberar_pagamento_no_checkout em checkins (AFTER UPDATE)
   - Dispara quando tipo = 'checkout' E confirmado_em é preenchido pela primeira vez
   - Chama Edge Function release-payment via pg_net com { application_id }

2. Edge Function release-payment — fluxo com segurança anti double-spend:
   a. Busca transaction: valida status = 'retido' E paid_at IS NOT NULL
   b. Se status != 'retido' → aborta (idempotência — previne duplo pagamento)
   c. Busca do banco: freelancer.validapay_account_number e freelancer.pix_key / pix_key_type
      (NUNCA aceita esses valores do request body)
   d. Chama POST /v1/wallet/withdraw com X-Idempotency-Key:
      {
        amount: job.valor - 10.00,
        pixKey: freelancer.pix_key,
        pixKeyType: freelancer.pix_key_type,
        accountId: freelancer.validapay_account_number
      }
      → Isso saca da subconta do freelancer para a chave PIX dele (mesma titularidade CPF)
      → O master (QueroExtra) controla o timing — freelancer não tem API credentials
   e. Atualiza transactions.status = 'liberado' + gateway_payment_id SOMENTE após confirmação da API
   f. Falha na API → mantém status = 'retido' + log de erro para retry manual

Segurança crítica:
- pix_key e accountId sempre buscados do banco (service role) — nunca do request body
- Double spend impossível: check de status no banco + X-Idempotency-Key na API
- status = 'liberado' gravado APÓS confirmação (não otimista)
- Edge Function só chamável via service_role_key (não exposta ao frontend)

Nota: Confirmar disponibilidade de pg_net no projeto Supabase antes de implementar o trigger.
Verificar também se há conflito com trigger_auto_generate_checkout existente em checkins.
```

---

## Resumo das mudanças por issue

| Issue | O que muda |
|-------|-----------|
| QUER-48 | Adicionar: pix_key coletada no onboarding + migrations freelancers |
| QUER-50 | Reescrever: split na cobrança com detalhes de segurança e idempotência |
| QUER-53 | Reescrever: release-payment chama wallet/withdraw na Valida Pay (não só atualiza status) |

As outras issues (QUER-47, QUER-51, QUER-52) não precisam de alteração.
