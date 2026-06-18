# PRD — Sprint 2: Integração Valida Pay
**Versão:** 3.0
**Data:** 2026-06-15
**Período da sprint:** 2026-06-11 a 2026-06-18
**Status:** Em andamento

---

## 1. Problema

O QueroExtra conecta empresas a freelancers para trabalhos pontuais. Atualmente, o pagamento acontece **de forma manual** — a empresa combina diretamente com o freelancer via PIX ou dinheiro após o turno. Isso gera:

- Risco de calote (empresa não paga após o trabalho)
- Risco inverso (empresa paga e freelancer não aparece)
- Plataforma não retém taxa — sem modelo de receita ativo
- Nenhum histórico financeiro auditável

---

## 2. Objetivo

Implementar o fluxo completo de pagamento via PIX com modelo de **custódia (escrow) via subconta** usando a **Valida Pay**, garantindo que:

- A empresa paga **antes** do trabalho acontecer (ao aprovar o candidato)
- O split é feito na cobrança: R$10 para a master (taxa) + valor líquido para a subconta do freelancer
- O dinheiro fica retido na subconta sob **controle exclusivo da master** (freelancer não tem API credentials para sacar)
- Somente após checkout confirmado, a master libera o saque via `wallet/withdraw` para a chave PIX do freelancer
- Todo o fluxo financeiro é rastreável no banco de dados

> **Por que subconta e não PIX direto?**
> A Valida Pay não permite que a master envie PIX para um CPF externo diretamente (`wallet/withdraw` da master exige mesma titularidade CNPJ). O mecanismo correto é: split coloca dinheiro na subconta do freelancer (registrada com o CPF dele), e a master controla quando sacar dessa subconta para a chave PIX do mesmo CPF.

---

## 3. Escopo desta sprint

### Dentro do escopo
- Onboarding do freelancer: subconta Valida Pay (KYC) + coleta de chave PIX
- Geração de cobrança PIX com split ao aprovar candidato
- Exibição de QR Code na tela da empresa
- Webhook de confirmação de pagamento (`charge.paid`, `account_approved`)
- Liberação automática após checkout: master chama `wallet/withdraw` na subconta do freelancer
- Tela de carteira do freelancer com histórico de transações

### Fora do escopo
- Subconta PJ (somente PF nesta sprint)
- Boleto e cartão de crédito
- Estorno/disputa de pagamentos
- Dashboard financeiro administrativo
- Notificação por WhatsApp/SMS sobre pagamento
- Taxa variável para vagas acima de R$200

---

## 4. Usuários impactados

| Persona | Impacto |
|---------|---------|
| **Freelancer** | Faz onboarding uma única vez (subconta + KYC + chave PIX); recebe automaticamente na conta bancária após cada checkout confirmado |
| **Empresa** | Paga via PIX ao aprovar candidato — QR Code integrado ao fluxo existente |
| **Plataforma (admin)** | Receita automática de R$10 por contratação (via split); master controla timing do repasse ao freelancer |

---

## 5. Fluxo principal

### 5.1 Onboarding do freelancer (uma vez)

```
Freelancer faz login pela primeira vez
          ↓
Sistema verifica validapay_onboarding_status
          ↓ (null)
Modal de onboarding abre automaticamente
          ↓
Etapa 1: Endereço (CEP auto-fill via ViaCEP)
          ↓
Etapa 2: Dados pessoais/financeiros + Chave PIX
  (data nascimento, nome mãe, faixa renda, ocupação, patrimônio, PPE)
  (tipo de chave PIX + valor da chave — validação por regex)
          ↓
Edge Function create-subaccount:
  - Salva endereço em profiles
  - Salva dados financeiros + pix_key + pix_key_type em freelancers
  - Chama POST /v1/proposals → obtém formId + urlDocumentscopy
  - Salva validapay_form_id, validapay_onboarding_status = 'em_analise'
          ↓
Etapa 3: Freelancer clica "Enviar documentos" → abre urlDocumentscopy (KYC)
          ↓
Valida Pay processa KYC (minutos a horas)
          ↓
Webhook account_approved → salva validapay_account_number
→ validapay_onboarding_status = 'aprovado'
          ↓
Freelancer liberado para se candidatar a vagas
```

### 5.2 Pagamento ao aprovar candidato

```
Empresa abre lista de candidatos da vaga
          ↓
Clica em "Aprovar" no candidato
          ↓
Edge Function create-pix-charge:
  1. Valida ownership da vaga (empresa autenticada = empresa da candidatura)
  2. Verifica validapay_account_number do freelancer (subconta aprovada)
  3. Verifica idempotência (sem transaction ativa para este application_id)
  4. Chama POST /v1/charges/pix COM SPLIT:
       R$10 → master QueroExtra (taxa)
       (job.valor - R$10) → subconta do freelancer (validapay_account_number)
  5. Salva transaction: status = 'retido', gateway_charge_id, emv, idempotency_key
          ↓
Modal com QR Code PIX abre na tela da empresa
          ↓
Empresa paga pelo app do banco
          ↓
Polling via Edge Function detecta status PAID → modal fecha
Webhook charge.paid → preenche paid_at para auditoria
          ↓
transaction.status = 'retido'
Split já processado:
  R$10 na conta master QueroExtra
  (job.valor - R$10) na subconta do freelancer — sob controle da master
```

### 5.3 Liberação após checkout

```
Freelancer realiza o turno de trabalho
          ↓
Checkout confirmado (código de saída validado)
          ↓
Trigger trg_liberar_pagamento_no_checkout detecta checkout confirmado
          ↓
Chama Edge Function release-payment via pg_net:
  1. Busca transaction: valida status = 'retido' E paid_at IS NOT NULL
  2. Se status != 'retido' → aborta (idempotência)
  3. Busca DO BANCO: validapay_account_number, pix_key, pix_key_type do freelancer
  4. Chama POST /v1/wallet/withdraw:
     {
       amount: job.valor - 10,
       pixKey: freelancer.pix_key,      ← chave de mesmo CPF da subconta
       pixKeyType: freelancer.pix_key_type,
       accountId: freelancer.validapay_account_number
     }
     X-Idempotency-Key: transaction.idempotency_key
  5. Aguarda confirmação da API
  6. Atualiza transaction.status = 'liberado' + gateway_payment_id
          ↓
PIX enviado da subconta do freelancer → conta bancária dele
(A Valida Pay valida mesma titularidade CPF automaticamente)
          ↓
Freelancer vê transação como "Pago via PIX" na carteira
```

---

## 6. Requisitos funcionais

### 6.1 Onboarding do freelancer

| ID | Requisito |
|----|-----------|
| RF-01 | Sistema verifica `validapay_onboarding_status` a cada login do freelancer |
| RF-02 | Freelancer sem onboarding vê modal ao acessar área de extras |
| RF-03 | Etapa 1 coleta endereço com CEP auto-fill via ViaCEP |
| RF-04 | Etapa 2 coleta dados pessoais/financeiros + chave PIX (tipo + valor com validação por tipo) |
| RF-05 | Submissão cria proposta via `POST /v1/proposals` e salva todos os dados |
| RF-06 | URL de KYC (`urlDocumentscopy`) exibida como botão na etapa 3 |
| RF-07 | Webhook `account_approved` salva `validapay_account_number` e muda status para `'aprovado'` |
| RF-08 | Freelancer `em_analise` ou `aprovado` não vê modal de onboarding |

### 6.2 Cobrança PIX

| ID | Requisito |
|----|-----------|
| RF-09 | Aprovação de candidato só prossegue se `validapay_onboarding_status = 'aprovado'` (RLS + frontend) |
| RF-10 | Cobrança PIX com split gerada automaticamente ao aprovar candidato |
| RF-11 | Split: R$10 fixo para master (taxa) + (job.valor - R$10) para subconta do freelancer |
| RF-12 | QR Code e código copia-e-cola exibidos imediatamente após aprovação |
| RF-13 | Polling a cada 5s via Edge Function proxy (nunca direto do frontend) |
| RF-14 | Detecção de `PAID` fecha modal e exibe confirmação |
| RF-15 | Empresa pode cancelar cobrança enquanto `status = PENDING` |
| RF-16 | QR Code expira após 60 min com opção de regerar |

### 6.3 Controle de status

| ID | Requisito |
|----|-----------|
| RF-17 | `transactions` criada com `status = 'retido'` ao gerar cobrança |
| RF-18 | Webhook `charge.paid` preenche `paid_at` — status permanece `'retido'` |
| RF-19 | Checkout confirmado → trigger → `release-payment` → `wallet/withdraw` → `status = 'liberado'` |
| RF-20 | `status = 'liberado'` gravado somente **após** confirmação da Valida Pay (não otimista) |
| RF-21 | Cancelamento muda `status = 'estornado'` |

### 6.4 Carteira do freelancer

| ID | Requisito |
|----|-----------|
| RF-22 | Tela de carteira exibe histórico de transações do banco interno |
| RF-23 | Status visual por cor: retido (amarelo) / liberado (verde) / estornado (cinza) |
| RF-24 | RLS garante que freelancer só vê suas próprias transações |
| RF-25 | Banner aparece se `validapay_onboarding_status !== 'aprovado'` |

---

## 7. Requisitos não-funcionais

| ID | Requisito |
|----|-----------|
| RNF-01 | Credenciais da Valida Pay nunca expostas no frontend |
| RNF-02 | Webhook responde `200 OK` em menos de 2s |
| RNF-03 | Polling via Edge Function proxy — frontend não acessa Valida Pay diretamente |
| RNF-04 | Token OAuth2 cacheado na Edge Function |
| RNF-05 | Todas as operações financeiras são idempotentes |
| RNF-06 | `release-payment` verifica `status = 'retido'` antes de qualquer disbursement (anti double spend) |
| RNF-07 | `pix_key`, `pix_key_type`, `validapay_account_number` sempre buscados do banco — nunca do request body |
| RNF-08 | `X-Idempotency-Key` em todas as chamadas à Valida Pay que geram movimentação financeira |

---

## 8. Modelo de dados

**`profiles`** — endereço para compliance
```sql
cep, rua, numero, complemento, bairro, cidade, estado  (text)
```

**`freelancers`** — dados financeiros + subconta + chave PIX
```sql
faixa_renda text, ocupacao text, faixa_patrimonio text
nome_mae text, data_nascimento text
validapay_form_id text
validapay_account_number text          -- retornado pelo webhook account_approved
validapay_onboarding_status text       -- CHECK IN ('em_analise','aprovado','rejeitado')
pix_key text                           -- chave PIX para recebimento via wallet/withdraw
pix_key_type text                      -- CHECK IN ('cpf','telefone','email','chave_aleatoria')
```

**`transactions`** — rastreabilidade do escrow
```sql
application_id uuid    REFERENCES applications ON DELETE RESTRICT
gateway_charge_id text -- chargeId da Valida Pay
emv text               -- payload do QR Code
paid_at timestamptz    -- preenchido pelo webhook charge.paid
idempotency_key text   UNIQUE
gateway_payment_id text -- ID do withdrawal após checkout
```

### Trigger
**`trg_liberar_pagamento_no_checkout`** em `checkins` AFTER UPDATE:
- Condição: `tipo = 'checkout'` AND `confirmado_em` preenchido pela primeira vez
- Ação: chama Edge Function `release-payment` via `pg_net`

---

## 9. Segurança — decisões críticas

| Ponto de risco | Medida |
|----------------|--------|
| Dados de pagamento | `pix_key`, `accountId` sempre do banco (service role) — nunca do request |
| Double spend | `status = 'retido'` verificado + `X-Idempotency-Key` |
| Identificação do usuário | JWT `auth.uid()` — nunca campos no body |
| Ownership da cobrança | Edge Function valida que `application_id` pertence à empresa autenticada |
| Timing do repasse | Master controla `wallet/withdraw` — freelancer não tem API credentials |
| Candidatura sem subconta | RLS no banco + frontend desabilita botão |
| Webhooks | Validar assinatura HMAC (se disponível na Valida Pay) |

---

## 10. Edge Functions

| Função | Chamada por | Responsabilidade |
|--------|-------------|-----------------|
| `_shared/validapay.ts` | outras funções | Auth OAuth2 + helper fetch ✅ |
| `create-subaccount` | frontend | Cria proposta PF + salva pix_key ✅ |
| `validapay-webhook` | Valida Pay | Roteamento de eventos |
| `create-pix-charge` | frontend (aprovação) | PIX com split |
| `check-pix-status` | frontend (polling) | Proxy de status da cobrança |
| `cancel-pix-charge` | frontend (cancelamento) | Cancela cobrança PENDING |
| `release-payment` | trigger do banco | `wallet/withdraw` da subconta → chave PIX freelancer |

---

## 11. Mapeamento de status

### `transactions.status`

| Status | Quando ocorre | Significado |
|--------|---------------|-------------|
| `retido` | Split processado + PIX pago | Dinheiro na subconta; aguardando checkout |
| `liberado` | Checkout confirmado + `wallet/withdraw` bem-sucedido | Freelancer recebeu na conta bancária |
| `estornado` | Cobrança cancelada | Sem pagamento ao freelancer |

### `freelancers.validapay_onboarding_status`

| Status | Quando | Impacto |
|--------|--------|---------|
| `null` | Sem onboarding | Vê modal, não pode se candidatar |
| `em_analise` | Formulário enviado | Não pode se candidatar |
| `aprovado` | Webhook `account_approved` | Fluxo normal |
| `rejeitado` | KYC rejeitado pela Valida Pay | Exibe mensagem + instrução para retentar |

---

## 12. Decisões pendentes

| # | Decisão | Impacto |
|---|---------|---------|
| D-01 | Assinatura HMAC de webhooks disponível na Valida Pay? | Segurança de webhook |
| D-02 | `pg_net` disponível no projeto Supabase? | Trigger pode não funcionar |
| D-03 | Conflito com `trigger_auto_generate_checkout`? | Double trigger no checkout |
| D-04 | Taxa acima de R$200? | Cálculo do split em RF-11 |
| D-05 | Sandbox aprova subcontas automaticamente? | Viabilidade de teste end-to-end |
| D-06 | Freelancer pode atualizar chave PIX após onboarding? | Afeta subcontas em andamento? |

---

## 13. Critérios de sucesso da sprint

- [ ] Freelancer completa onboarding (subconta + KYC + chave PIX) e tem subconta aprovada
- [ ] Empresa aprova candidato → QR Code PIX com split gerado automaticamente
- [ ] PIX pago → split: R$10 na master + valor líquido na subconta do freelancer
- [ ] Checkout confirmado → `wallet/withdraw` automático → freelancer recebe na conta bancária
- [ ] Freelancer vê histórico de transações com status correto na carteira
- [ ] Nenhuma credencial da Valida Pay exposta no client-side
- [ ] Double spend impossível: segundo checkout não gera segundo pagamento
