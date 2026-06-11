# Sprint 2 — Integração Valida Pay
**Período:** 2026-06-11 (Qua) a 2026-06-18 (Qua)
**Objetivo:** Pagamento via PIX com split automático funcionando end-to-end — freelancer tem subconta Valida Pay aprovada, empresa paga ao aprovar candidato, plataforma retém R$10, freelancer recebe na subconta e saca manualmente após checkout confirmado.

---

## Épico: Integração Valida Pay

---

### US-01 — Configurar cliente Valida Pay e ambiente sandbox

**Como** desenvolvedor, **quero** um cliente HTTP autenticado e centralizado para a Valida Pay **para** que todas as Edge Functions usem sem duplicar lógica de autenticação.

**Endpoints Valida Pay utilizados:**
- `POST {{auth_url}}/auth/token` — OAuth2 `client_credentials` → Bearer token

**O que implementar:**
- Edge Function `validapay-client/index.ts` com:
  - `getValidaPayToken()` — busca token via `client_credentials`, cacheia em memória por duração do token
  - `validaPayFetch(path, options, subAccountNumber?)` — injeta `Authorization: Bearer <token>` e opcionalmente `X-Sub-Account` header
- Variáveis de ambiente a configurar no Supabase Dashboard (sandbox):
  - `VALIDAPAY_BASE_URL`
  - `VALIDAPAY_AUTH_URL`
  - `VALIDAPAY_CLIENT_ID`
  - `VALIDAPAY_CLIENT_SECRET`
- Escopos necessários para a sprint inteira: `pix.cob/write pix.cob/read wallet/write wallet/read proposals/write subaccounts/read`

**Triggers/migrations necessários:** Nenhum

**Critérios de aceite:**
- [ ] `getValidaPayToken()` retorna token válido no sandbox
- [ ] `validaPayFetch()` retorna `401` corretamente se credenciais inválidas
- [ ] Nenhuma credencial exposta no frontend — tudo server-side via Edge Functions
- [ ] Variáveis de ambiente configuradas no projeto Supabase

**Estimativa:** P
**Prioridade:** Alta

---

### US-02 — Onboarding do freelancer: coletar dados e criar subconta Valida Pay

**Como** freelancer, **quero** completar meu onboarding financeiro ao fazer primeiro login **para** poder receber pagamentos via split na plataforma.

**Endpoints Valida Pay utilizados:**
- `POST {{base_url}}/v1/proposals` — cria proposta de subconta PF com dados do freelancer

**O que implementar:**

**Frontend:**
- Verificação de onboarding ao logar: se `freelancers.validapay_onboarding_status IS NULL`, redirecionar para `/onboarding`
- Tela `/onboarding` com formulário em etapas:
  - **Etapa 1 — Endereço:** CEP (com auto-complete via ViaCEP), rua, número, complemento, bairro, cidade, estado
  - **Etapa 2 — Dados financeiros:** faixa de renda (dropdown), ocupação (dropdown), faixa de patrimônio (dropdown) — mapear para os códigos da Valida Pay (`1DINP02`, `ONP07`, etc.)
  - **Etapa 3 — Verificação de identidade:** exibir botão "Verificar minha identidade" que abre `urlDocumentscopy` em nova aba + instrução "Após completar a verificação, volte aqui"
  - Botão "Já completei a verificação" → polling do status
- Estado visual do onboarding: `pendente` → `em_analise` → `aprovado` / `rejeitado`

**Backend:**
- Edge Function `create-subaccount/index.ts`:
  - Recebe dados do formulário + `freelancer_id`
  - Salva endereço e dados financeiros no banco (ver migration)
  - Chama `POST /v1/proposals` com todos os dados
  - Salva `validapay_form_id` e `validapay_onboarding_status = 'em_analise'` em `freelancers`
  - Retorna `urlDocumentscopy` para o frontend exibir o botão de KYC

**Triggers/migrations necessários:**
```sql
-- Dados de endereço no perfil
ALTER TABLE profiles ADD COLUMN cep text;
ALTER TABLE profiles ADD COLUMN rua text;
ALTER TABLE profiles ADD COLUMN numero text;
ALTER TABLE profiles ADD COLUMN complemento text;
ALTER TABLE profiles ADD COLUMN bairro text;
ALTER TABLE profiles ADD COLUMN cidade text;
ALTER TABLE profiles ADD COLUMN estado text;

-- Dados financeiros e status Valida Pay no freelancer
ALTER TABLE freelancers ADD COLUMN faixa_renda text;
ALTER TABLE freelancers ADD COLUMN ocupacao text;
ALTER TABLE freelancers ADD COLUMN faixa_patrimonio text;
ALTER TABLE freelancers ADD COLUMN validapay_form_id text;
ALTER TABLE freelancers ADD COLUMN validapay_account_number text;
ALTER TABLE freelancers ADD COLUMN validapay_onboarding_status text
  CHECK (validapay_onboarding_status IN ('em_analise', 'aprovado', 'rejeitado'));
```

**Critérios de aceite:**
- [ ] Freelancer sem onboarding completo é redirecionado para `/onboarding` ao logar
- [ ] Formulário salva endereço e dados financeiros no banco
- [ ] Edge Function chama `POST /v1/proposals` com sucesso no sandbox
- [ ] `validapay_form_id` e `validapay_onboarding_status = 'em_analise'` são salvos
- [ ] URL de KYC (`urlDocumentscopy`) é exibida como botão para o freelancer
- [ ] Freelancer com `validapay_onboarding_status = 'aprovado'` não vê tela de onboarding

**Estimativa:** G
**Prioridade:** Alta

---

### US-03 — Webhook `account_approved` → liberar freelancer na plataforma

**Como** plataforma, **quero** receber confirmação automática da Valida Pay quando a subconta do freelancer for aprovada **para** habilitar o freelancer a se candidatar a vagas.

**Endpoints Valida Pay utilizados:**
- Webhook recebido: evento `account_approved`
  ```json
  {
    "event": "account_approved",
    "account": { "account": "123456" },
    "documentNumber": "CPF do freelancer"
  }
  ```

**O que implementar:**
- Edge Function `validapay-webhook/index.ts` (única função para todos os webhooks):
  - Roteamento por `event`:
    - `account_approved` → busca freelancer por CPF, salva `validapay_account_number`, atualiza `validapay_onboarding_status = 'aprovado'`
    - `charge.paid` → tratado na US-06
  - Responde `200 OK` imediatamente em todos os casos (evitar reenvio da Valida Pay)

**Triggers/migrations necessários:** Nenhum (usa colunas criadas em US-02)

**Critérios de aceite:**
- [ ] Webhook recebe `account_approved` e salva `validapay_account_number` no freelancer correto (busca por CPF)
- [ ] `validapay_onboarding_status` muda para `'aprovado'`
- [ ] Freelancer aprovado consegue se candidatar a vagas (verificação de status no frontend)
- [ ] Eventos desconhecidos respondem `200` e são ignorados sem erro

**Estimativa:** M
**Prioridade:** Alta

---

### US-04 — Gerar cobrança PIX com split ao aprovar candidato

**Como** empresa, **quero** que ao aprovar um candidato seja gerada automaticamente uma cobrança PIX com split **para** que R$10 vá para a plataforma e o restante vá direto para a subconta do freelancer.

**Endpoints Valida Pay utilizados:**
- `POST {{base_url}}/v1/charges/pix` — cobrança com split automático

**O que implementar:**
- Edge Function `create-pix-charge/index.ts`:
  - Recebe `application_id`
  - Valida que `freelancers.validapay_account_number` está preenchido (subconta aprovada)
  - Calcula: `valor_bruto = job.valor`, `taxa_plataforma = 10.00`, `valor_liquido = valor_bruto - 10.00`
  - Chama `POST /v1/charges/pix`:
    ```json
    {
      "amount": valor_bruto,
      "expiration": 3600,
      "customer": {
        "name": empresa.nome,
        "documentNumber": empresa.cnpj_cpf,
        "email": empresa.email,
        "phone": empresa.celular
      },
      "split": [
        {
          "type": "fixed",
          "accountNumber": freelancer.validapay_account_number,
          "amount": valor_liquido
        }
      ],
      "metadata": { "externalId": application_id },
      "webhookUrl": "<SUPABASE_URL>/functions/v1/validapay-webhook"
    }
    ```
  - Cria registro em `transactions` com `status = 'retido'`, `gateway_charge_id = chargeId`, `emv`, `application_id`
  - Retorna `{ chargeId, emv }` para o frontend exibir o QR Code
- Chamar esta Edge Function em `CandidatosTab.tsx` após `handleApprove()` bem-sucedido

**Triggers/migrations necessários:**
```sql
ALTER TABLE transactions
  ADD COLUMN application_id uuid REFERENCES applications ON DELETE RESTRICT,
  ADD COLUMN gateway_charge_id text,
  ADD COLUMN emv text;
-- Manter stripe_payment_intent como nullable para não quebrar nada
```

**Critérios de aceite:**
- [ ] Aprovação do candidato dispara a Edge Function
- [ ] Split configurado corretamente: R$10 para master, restante para subconta do freelancer
- [ ] `transactions` criada com `status = 'retido'`, `gateway_charge_id` e `emv` preenchidos
- [ ] Erro se freelancer não tiver `validapay_account_number` — bloqueia aprovação com mensagem clara
- [ ] Erro da Valida Pay é tratado e não deixa candidatura aprovada sem transaction

**Estimativa:** G
**Prioridade:** Alta

---

### US-05 — Exibir QR Code PIX na tela da empresa

**Como** empresa, **quero** ver o QR Code PIX imediatamente após aprovar um candidato **para** poder pagar pelo app do banco na hora.

**Endpoints Valida Pay utilizados:**
- `GET {{base_url}}/v1/charges/:chargeId` — polling de status (PENDING → PAID)

**O que implementar:**
- Componente `PixQrCodeModal.tsx` em `src/components/empresa/`:
  - Exibe QR Code renderizado a partir do `emv` (usar `qrcode.react`)
  - Exibe código "copia e cola" (`emv`) em campo copiável
  - Exibe valor e nome do freelancer
  - Texto: "Aguardando pagamento PIX..."
  - Polling a cada 5s via Edge Function proxy em `GET /v1/charges/:chargeId`
  - Ao detectar `status: "PAID"`: fecha modal, exibe toast de sucesso "Pagamento confirmado!"
  - Botão "Cancelar cobrança" → `DELETE /v1/charges/:chargeId` + `transactions.status = 'estornado'`
  - Expiração após 60 min com mensagem "QR Code expirado — gere um novo"
- Abrir modal em `CandidatosTab.tsx` com retorno `{ chargeId, emv }` da US-04

**Triggers/migrations necessários:** Nenhum

**Critérios de aceite:**
- [ ] QR Code exibido imediatamente após aprovação
- [ ] Código copia-e-cola disponível abaixo do QR Code
- [ ] Polling detecta `status: "PAID"` e fecha modal com feedback
- [ ] Cancelar cobrança funciona e atualiza `transactions.status = 'estornado'`
- [ ] QR Code expirado exibe mensagem e opção de regerar

**Estimativa:** M
**Prioridade:** Alta

---

### US-06 — Webhook `charge.paid` → confirmar pagamento retido

**Como** plataforma, **quero** receber confirmação oficial da Valida Pay quando o PIX for pago **para** ter registro server-side independente do polling do frontend.

**Endpoints Valida Pay utilizados:**
- Webhook recebido: evento `charge.paid`
  ```json
  {
    "event": "charge.paid",
    "chargeId": "cha_xxx",
    "status": "PAID",
    "amount": 100.0,
    "metadata": { "externalId": "application_id" }
  }
  ```

**O que implementar:**
- Adicionar handler `charge.paid` na Edge Function `validapay-webhook/index.ts` (criada em US-03):
  - Busca transaction por `gateway_charge_id = chargeId`
  - Se `status = 'retido'`, atualiza `transactions.paid_at = now()` (novo campo opcional para auditoria)
  - Responde `200 OK`

**Observação:** O status permanece `'retido'` — o split já depositou o valor na subconta do freelancer, mas o saque só é permitido após checkout (US-07). O webhook serve como confirmação de auditoria.

**Triggers/migrations necessários:** Nenhum (opcional: `ADD COLUMN paid_at timestamptz` em transactions)

**Critérios de aceite:**
- [ ] Webhook recebe `charge.paid` e encontra transaction por `gateway_charge_id`
- [ ] Responde `200` imediatamente
- [ ] Não altera status (permanece `'retido'` até checkout)
- [ ] Evento `charge.canceled` muda `transactions.status = 'estornado'`

**Estimativa:** P
**Prioridade:** Alta

---

### US-07 — Trigger: checkout confirmado libera saque na plataforma

**Como** plataforma, **quero** que ao confirmar o checkout o pagamento seja marcado como liberado automaticamente **para** que o freelancer possa sacar sem intervenção manual.

**Endpoints Valida Pay utilizados:** Nenhum

**O que implementar:**
- Migration com trigger de banco `trg_liberar_pagamento_no_checkout`:
  ```sql
  CREATE OR REPLACE FUNCTION liberar_pagamento_no_checkout()
  RETURNS trigger AS $$
  DECLARE
    v_freelancer_id uuid;
    v_transaction_id uuid;
  BEGIN
    IF NEW.tipo = 'checkout'
      AND NEW.confirmado_em IS NOT NULL
      AND OLD.confirmado_em IS NULL
    THEN
      SELECT a.freelancer_id INTO v_freelancer_id
      FROM applications a WHERE a.id = NEW.application_id;

      UPDATE transactions
        SET status = 'liberado'
        WHERE application_id = NEW.application_id
          AND status = 'retido'
      RETURNING id INTO v_transaction_id;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER trg_liberar_pagamento_no_checkout
    AFTER UPDATE ON checkins
    FOR EACH ROW EXECUTE FUNCTION liberar_pagamento_no_checkout();
  ```
- Verificar que não conflita com trigger existente `trigger_auto_generate_checkout`

**Triggers/migrations necessários:**
- Migration acima com função + trigger

**Critérios de aceite:**
- [ ] Confirmar checkout muda `transactions.status` de `'retido'` para `'liberado'`
- [ ] Trigger não dispara em check-ins (tipo = 'checkin')
- [ ] Trigger não dispara se `confirmado_em` já estava preenchido (idempotente)
- [ ] Não conflita com trigger existente `trigger_auto_generate_checkout`

**Estimativa:** M
**Prioridade:** Alta

---

### US-08 — Tela de carteira do freelancer com saldo real

**Como** freelancer, **quero** ver meu saldo disponível para saque na carteira **para** saber o quanto tenho disponível após meus trabalhos.

**Endpoints Valida Pay utilizados:**
- `GET {{base_url}}/v1/wallet/balance?accountId={{validapay_account_number}}` — saldo real na subconta

**O que implementar:**
- Edge Function `get-wallet-balance/index.ts`:
  - Busca `freelancers.validapay_account_number` do usuário autenticado
  - Chama `GET /v1/wallet/balance?accountId=xxx`
  - Retorna `{ balance, accountNumber }`
- Substituir mock em `src/pages/extras/ExtrasHome.tsx` (componente `CarteiraPage`):
  - Exibir saldo real retornado pela Edge Function
  - Listar últimas transações liberadas do banco interno
  - Status do onboarding: se `validapay_onboarding_status != 'aprovado'`, exibe banner "Complete seu cadastro para receber pagamentos"
  - Botão "Sacar" habilitado apenas se `balance > 0` e `validapay_onboarding_status = 'aprovado'`

**Triggers/migrations necessários:** Nenhum

**Critérios de aceite:**
- [ ] Saldo exibido corresponde ao retorno de `GET /v1/wallet/balance`
- [ ] Lista de transações com `status = 'liberado'` exibida com valor e data
- [ ] Banner de onboarding pendente exibido corretamente
- [ ] Botão "Sacar" desabilitado quando saldo = 0

**Estimativa:** M
**Prioridade:** Média

---

### US-09 — Fluxo de saque do freelancer via subconta Valida Pay

**Como** freelancer, **quero** sacar meu saldo disponível para minha chave PIX **para** receber o dinheiro na minha conta bancária.

**Endpoints Valida Pay utilizados:**
- `POST {{base_url}}/v1/wallet/withdraw` — saque da subconta para chave PIX

**O que implementar:**
- Edge Function `freelancer-withdraw/index.ts`:
  - Recebe `{ amount, pixKey, pixKeyType }` do freelancer autenticado
  - Busca `validapay_account_number` e `cpf` do freelancer
  - Valida: `amount > 0`, saldo suficiente (verificar via `GET /v1/wallet/balance`)
  - Chama `POST /v1/wallet/withdraw`:
    ```json
    {
      "amount": amount,
      "pixKey": pixKey,
      "pixKeyType": pixKeyType,
      "accountId": validapay_account_number
    }
    ```
  - Retorna `{ withdrawalId, status: "PROCESSING" }` para o frontend
- UI em `CarteiraPage`: bottom sheet "Sacar" com:
  - Valor a sacar (max = saldo disponível)
  - Tipo de chave PIX: dropdown (CPF / Email / Telefone / Chave aleatória)
  - Campo da chave PIX
  - Aviso: "O saque só pode ser feito para uma chave PIX de mesma titularidade (CPF: xxx.xxx.xxx-xx)"
  - Botão "Confirmar Saque" com loading state

**Triggers/migrations necessários:** Nenhum

**Critérios de aceite:**
- [ ] Saque com chave PIX válida retorna `withdrawalId`
- [ ] Erro `OWNERSHIP_MISMATCH` exibe mensagem clara ("A chave PIX deve pertencer ao titular da conta")
- [ ] Não permite sacar mais do que o saldo disponível
- [ ] Loading state durante chamada à API
- [ ] Toast de confirmação após saque iniciado com sucesso

**Estimativa:** G
**Prioridade:** Média

---

## Regras de Negócio

| Regra | Valor |
|-------|-------|
| Valor mínimo de vaga | R$ 50,00 |
| Taxa da plataforma | R$ 10,00 fixo (vagas até R$ 200) |
| Split | Automático na cobrança (Valida Pay) |
| Retenção | Pagamento na subconta do freelancer, saque bloqueado até checkout |
| Quem inicia o saque | Freelancer (manual, após checkout confirmado) |
| Titularidade do saque | Chave PIX deve pertencer ao mesmo CPF do freelancer |
| Candidatura bloqueada | Freelancer sem `validapay_onboarding_status = 'aprovado'` não pode ser aprovado |

---

## Gaps e Decisões Pendentes

### Migrations necessárias (resumo)

| Tabela | Tipo | Coluna(s) |
|--------|------|-----------|
| `profiles` | ADD | `cep`, `rua`, `numero`, `complemento`, `bairro`, `cidade`, `estado` |
| `freelancers` | ADD | `faixa_renda`, `ocupacao`, `faixa_patrimonio` |
| `freelancers` | ADD | `validapay_form_id`, `validapay_account_number`, `validapay_onboarding_status` |
| `freelancers` | MANTER | `stripe_account_id` (nullable, não usar) |
| `transactions` | ADD | `application_id` (FK), `gateway_charge_id`, `emv` |

### Triggers a criar

| Nome | Tabela | Evento | Ação |
|------|--------|--------|------|
| `trg_liberar_pagamento_no_checkout` | `checkins` | AFTER UPDATE | `transactions.status → 'liberado'` |

**Atenção:** Verificar conflito com `trigger_auto_generate_checkout` (existente em `checkins`).

### Edge Functions a criar

| Função | US | Responsabilidade |
|--------|----|-----------------|
| `validapay-client` | US-01 | Auth + helper fetch |
| `create-subaccount` | US-02 | Criar proposta PF na Valida Pay |
| `validapay-webhook` | US-03/06 | Receber todos os eventos |
| `create-pix-charge` | US-04 | PIX com split |
| `get-wallet-balance` | US-08 | Saldo da subconta |
| `freelancer-withdraw` | US-09 | Saque via Valida Pay |

### Variáveis de ambiente necessárias

```
VALIDAPAY_BASE_URL=
VALIDAPAY_AUTH_URL=
VALIDAPAY_CLIENT_ID=
VALIDAPAY_CLIENT_SECRET=
```

### Decisões de produto pendentes

1. **Taxa para vagas > R$ 200:** A regra atual é R$ 10 fixo para vagas até R$ 200. Qual a taxa acima disso?
2. **Valor mínimo de saque:** Qual o valor mínimo permitido para saque? (impacta validação da US-09)
3. **Bloqueio de candidatura:** O freelancer sem subconta aprovada deve ser oculto das buscas ou apenas bloqueado no momento da aprovação pela empresa?
4. **Rejeição de subconta:** Se a Valida Pay rejeitar o KYC do freelancer, qual o fluxo? Ele pode retentar?
5. **Códigos financeiros da Valida Pay:** Mapear os enums de `declaredIncome`, `occupation` e `netWorth` para labels amigáveis nos dropdowns do onboarding

### Riscos para o prazo

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Credenciais sandbox não disponíveis no dia 1 | Bloqueia US-02 a US-09 | Solicitar hoje; US-01 pode ser codificada sem testar |
| KYC sandbox não aprova automaticamente | Bloqueia teste do fluxo completo | Verificar com Valida Pay se sandbox aprova automaticamente |
| Trigger conflita com `trigger_auto_generate_checkout` | Dupla execução no checkout | Inspecionar função antes de criar o trigger |
| 9 US em 7 dias | Sprint incompleta | Priorizar US-01 a US-07 (core do pagamento); US-08 e US-09 são entregáveis paralelos |
| `wallets` não criada automaticamente no cadastro | US-07 sem carteira para crédito futuro | Verificar trigger `handle_new_user`; adicionar criação de wallet se ausente |
