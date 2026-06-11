# PRD — Sprint 2: Integração Valida Pay
**Versão:** 1.0
**Data:** 2026-06-11
**Período da sprint:** 2026-06-11 a 2026-06-18
**Status:** Em planejamento

---

## 1. Problema

O QueroExtra conecta empresas a freelancers para trabalhos pontuais. Atualmente, o pagamento acontece **de forma manual** — a empresa combina diretamente com o freelancer via PIX ou dinheiro após o turno. Isso gera:

- Risco de calote (empresa não paga após o trabalho)
- Risco inverso (empresa paga e freelancer não aparece)
- Plataforma não retém taxa — sem modelo de receita ativo
- Nenhum histórico financeiro auditável

---

## 2. Objetivo

Implementar o fluxo completo de pagamento via PIX com split automático usando a **Valida Pay**, garantindo que:

- A empresa paga **antes** do trabalho acontecer (ao aprovar o candidato)
- A plataforma retém automaticamente sua taxa de R$10
- O freelancer recebe na subconta Valida Pay e só pode sacar após o checkout
- Todo o fluxo financeiro é rastreável no banco de dados

---

## 3. Escopo desta sprint

### Dentro do escopo
- Onboarding financeiro do freelancer (subconta Valida Pay + KYC)
- Geração de cobrança PIX com split automático ao aprovar candidato
- Exibição de QR Code na tela da empresa
- Webhook de confirmação de pagamento
- Liberação automática do saldo após checkout
- Tela de carteira do freelancer com saldo real
- Fluxo de saque do freelancer via PIX

### Fora do escopo
- Subconta PJ (somente PF nesta sprint)
- Boleto e cartão de crédito
- Estorno/disputa de pagamentos
- Dashboard financeiro administrativo
- Notificação por WhatsApp/SMS sobre pagamento
- Taxa variável para vagas acima de R$200 (pendente decisão de produto)

---

## 4. Usuários impactados

| Persona | Impacto |
|---------|---------|
| **Freelancer** | Precisa completar onboarding financeiro (KYC) uma única vez para receber pagamentos |
| **Empresa** | Paga via PIX ao aprovar candidato — experiência de pagamento integrada ao fluxo já existente |
| **Plataforma (admin)** | Passa a ter receita automática de R$10 por contratação concluída |

---

## 5. Fluxo principal

### 5.1 Onboarding do freelancer (uma vez)

```
Freelancer faz login pela primeira vez
          ↓
Sistema verifica validapay_onboarding_status
          ↓ (null ou pendente)
Tela de onboarding → Etapa 1: Endereço
          ↓
Etapa 2: Dados financeiros (renda, ocupação, patrimônio)
          ↓
QueroExtra chama POST /v1/proposals automaticamente
          ↓
Etapa 3: Exibe botão "Verificar identidade"
→ abre urlDocumentscopy em nova aba
          ↓
Freelancer faz selfie + foto do RG no site da Valida Pay
          ↓
Valida Pay processa KYC (minutos a horas)
          ↓
Webhook account_approved → salva accountNumber
→ validapay_onboarding_status = 'aprovado'
          ↓
Freelancer liberado para receber candidaturas
```

### 5.2 Pagamento ao aprovar candidato

```
Empresa abre lista de candidatos da vaga
          ↓
Clica em "Aprovar" no candidato desejado
          ↓
Sistema verifica se freelancer tem subconta aprovada
          ↓ (aprovado)
Edge Function cria PIX com split:
  valor_bruto → empresa paga
  R$10 → conta master QueroExtra (taxa)
  valor_liquido → subconta do freelancer (Valida Pay)
          ↓
Modal com QR Code PIX abre na tela da empresa
          ↓
Empresa paga pelo app do banco
          ↓
Polling detecta status PAID → modal fecha com sucesso
Webhook charge.paid → auditoria no banco
          ↓
transactions.status = 'retido'
(dinheiro está na subconta do freelancer, saque bloqueado)
```

### 5.3 Liberação após checkout

```
Freelancer realiza o turno de trabalho
          ↓
Checkout confirmado (código de saída validado)
          ↓
Trigger de banco executa automaticamente:
transactions.status: 'retido' → 'liberado'
          ↓
Freelancer vê saldo disponível na carteira
          ↓
Freelancer solicita saque informando chave PIX
          ↓
Edge Function chama POST /v1/wallet/withdraw
→ Valida Pay envia PIX para conta do freelancer
          ↓
Freelancer recebe dinheiro na conta bancária
```

---

## 6. Requisitos funcionais

### 6.1 Onboarding financeiro

| ID | Requisito |
|----|-----------|
| RF-01 | Sistema verifica `validapay_onboarding_status` a cada login do freelancer |
| RF-02 | Freelancer sem onboarding é redirecionado para `/onboarding` antes de acessar qualquer feature |
| RF-03 | Formulário coleta: CEP, endereço completo, faixa de renda, ocupação, faixa de patrimônio |
| RF-04 | CEP auto-completa endereço via ViaCEP |
| RF-05 | Submissão do formulário dispara `POST /v1/proposals` automaticamente |
| RF-06 | URL de KYC (`urlDocumentscopy`) é exibida como botão de ação após submissão |
| RF-07 | Webhook `account_approved` salva `accountNumber` e muda status para `'aprovado'` |
| RF-08 | Freelancer com KYC rejeitado vê mensagem de erro e instrução para retentar |

### 6.2 Cobrança PIX

| ID | Requisito |
|----|-----------|
| RF-09 | Aprovação de candidato só prossegue se freelancer tiver `validapay_onboarding_status = 'aprovado'` |
| RF-10 | Cobrança PIX é gerada automaticamente ao aprovar candidato, sem etapa extra para a empresa |
| RF-11 | Split: R$10 fixo para conta master, restante para subconta do freelancer |
| RF-12 | QR Code e código copia-e-cola exibidos imediatamente após aprovação |
| RF-13 | Polling a cada 5s verifica `status` da cobrança |
| RF-14 | Detecção de pagamento fecha o modal e exibe confirmação |
| RF-15 | Empresa pode cancelar cobrança enquanto status = PENDING |
| RF-16 | QR Code expira após 60 minutos com opção de regerar |

### 6.3 Controle de status

| ID | Requisito |
|----|-----------|
| RF-17 | Registro em `transactions` criado com `status = 'retido'` ao gerar cobrança |
| RF-18 | Webhook `charge.paid` confirma pagamento — status permanece `'retido'` |
| RF-19 | Checkout confirmado muda `transactions.status` para `'liberado'` via trigger automático |
| RF-20 | Cancelamento de cobrança muda `transactions.status` para `'estornado'` |

### 6.4 Carteira e saque

| ID | Requisito |
|----|-----------|
| RF-21 | Tela de carteira exibe saldo real da subconta Valida Pay |
| RF-22 | Lista de transações liberadas exibida com valor e data |
| RF-23 | Botão "Sacar" habilitado apenas quando há saldo disponível e status = `'aprovado'` |
| RF-24 | Saque exige: valor, tipo de chave PIX e chave PIX |
| RF-25 | Validação de titularidade (chave PIX deve pertencer ao mesmo CPF) — erro claro se rejeitado |
| RF-26 | Freelancer vê feedback de saque em processamento após confirmar |

---

## 7. Requisitos não-funcionais

| ID | Requisito |
|----|-----------|
| RNF-01 | Credenciais da Valida Pay nunca expostas no frontend — todas as chamadas via Edge Functions |
| RNF-02 | Webhook responde `200 OK` em menos de 2s (Valida Pay retenta se não receber resposta) |
| RNF-03 | Polling do QR Code usa Edge Function como proxy (não expõe `client_id/secret`) |
| RNF-04 | Token OAuth2 não é buscado a cada requisição — cachear na Edge Function durante o ciclo de vida |
| RNF-05 | Todas as operações financeiras são idempotentes (reenvio de webhook não duplica registros) |
| RNF-06 | `transactions.application_id` garante rastreabilidade: cada pagamento vinculado a uma candidatura |

---

## 8. Modelo de dados — changes

### Novas colunas em tabelas existentes

**`profiles`**
```sql
cep          text
rua          text
numero       text
complemento  text
bairro       text
cidade       text
estado       text
```

**`freelancers`**
```sql
faixa_renda                text                         -- código Valida Pay (ex: "1DINP02")
ocupacao                   text                         -- código Valida Pay (ex: "ONP07")
faixa_patrimonio           text                         -- código Valida Pay (ex: "NWNP02")
validapay_form_id          text                         -- retornado pelo POST /v1/proposals
validapay_account_number   text                         -- retornado pelo webhook account_approved
validapay_onboarding_status text CHECK IN ('em_analise', 'aprovado', 'rejeitado')
-- stripe_account_id: manter como nullable, não usar
```

**`transactions`**
```sql
application_id    uuid  REFERENCES applications ON DELETE RESTRICT
gateway_charge_id text  -- chargeId da Valida Pay (ex: cha_xxx)
emv               text  -- payload do QR Code para exibição
-- stripe_payment_intent: manter como nullable, não usar
```

### Novo trigger

**`trg_liberar_pagamento_no_checkout`** em `checkins` AFTER UPDATE:
- Condição: `tipo = 'checkout'` AND `confirmado_em` preenchido pela primeira vez
- Ação: `transactions.status = 'retido' → 'liberado'` para a candidatura correspondente

---

## 9. Edge Functions

| Função | Método | Chamada por | Responsabilidade |
|--------|--------|-------------|-----------------|
| `validapay-client` | interno | outras funções | Helper de auth + fetch |
| `create-subaccount` | POST | frontend (onboarding) | `POST /v1/proposals` |
| `validapay-webhook` | POST | Valida Pay | Roteamento de eventos |
| `create-pix-charge` | POST | frontend (aprovação) | PIX com split |
| `get-charge-status` | GET | frontend (polling) | `GET /v1/charges/:id` |
| `get-wallet-balance` | GET | frontend (carteira) | `GET /v1/wallet/balance` |
| `freelancer-withdraw` | POST | frontend (saque) | `POST /v1/wallet/withdraw` |

---

## 10. Variáveis de ambiente

```
VALIDAPAY_BASE_URL          # URL base da API (sandbox e produção)
VALIDAPAY_AUTH_URL          # URL de autenticação OAuth2
VALIDAPAY_CLIENT_ID         # Client ID da conta master QueroExtra
VALIDAPAY_CLIENT_SECRET     # Secret da conta master QueroExtra
```

---

## 11. Mapeamento de status

### `transactions.status`

| Status | Quando ocorre | Ação permitida |
|--------|---------------|----------------|
| `retido` | Cobrança gerada + PIX pago | Nenhuma (aguardando checkout) |
| `liberado` | Checkout confirmado | Freelancer pode sacar |
| `estornado` | Cobrança cancelada / disputa | Nenhuma |

### `freelancers.validapay_onboarding_status`

| Status | Quando ocorre | Impacto |
|--------|---------------|---------|
| `null` | Cadastro sem onboarding | Redirecionado para `/onboarding` |
| `em_analise` | Formulário enviado, aguardando KYC | Não pode ser aprovado em vagas |
| `aprovado` | Webhook `account_approved` recebido | Fluxo normal |
| `rejeitado` | Valida Pay rejeitou o KYC | Exibe mensagem + opção de retentar |

---

## 12. Decisões pendentes (bloqueantes)

| # | Decisão | Impacto | Owner |
|---|---------|---------|-------|
| D-01 | Taxa para vagas acima de R$ 200 | Cálculo do split em RF-11 | Produto |
| D-02 | Valor mínimo de saque | Validação em RF-24 | Produto |
| D-03 | Freelancer rejeitado pelo KYC pode retentar? Qual o prazo? | RF-08 | Produto |
| D-04 | Freelancer sem subconta aprovada fica oculto nas buscas ou apenas bloqueado na aprovação? | RF-09 + UX | Produto |
| D-05 | Sandbox da Valida Pay aprova subcontas automaticamente? | Viabilidade de teste end-to-end | Tech |
| D-06 | Quais os códigos financeiros disponíveis na Valida Pay? (enums de renda/ocupação/patrimônio) | RF-05 + labels do formulário | Tech |

---

## 13. Critérios de sucesso da sprint

- [ ] Freelancer consegue criar subconta Valida Pay pelo app e ter o KYC aprovado
- [ ] Empresa aprova candidato → QR Code PIX gerado automaticamente com split configurado
- [ ] PIX pago → `transactions.status = 'retido'` registrado no banco
- [ ] Checkout confirmado → `transactions.status = 'liberado'` via trigger automático
- [ ] Freelancer vê saldo real na carteira
- [ ] Freelancer consegue sacar para chave PIX de mesma titularidade
- [ ] Nenhuma credencial da Valida Pay exposta no client-side
