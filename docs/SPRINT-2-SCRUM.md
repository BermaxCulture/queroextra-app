# Sprint 2 — Integração Valida Pay
**Período:** 2026-06-11 (Qua) a 2026-06-18 (Qua)
**Objetivo:** Pagamento via PIX com modelo de custódia (escrow) funcionando end-to-end — empresa paga ao aprovar candidato com split automático (R$10 master + valor líquido para subconta do freelancer), dinheiro fica retido na subconta sob controle exclusivo da master, e somente após checkout confirmado a master libera o saque via Valida Pay direto para a chave PIX do freelancer.

---

## Épico: Integração Valida Pay

---

### US-01 — Configurar cliente Valida Pay e ambiente sandbox

**Como** desenvolvedor, **quero** um cliente HTTP autenticado e centralizado para a Valida Pay **para** que todas as Edge Functions usem sem duplicar lógica de autenticação.

**Endpoints Valida Pay utilizados:**
- `POST {{auth_url}}/auth/token` — OAuth2 `client_credentials` → Bearer token

**O que implementar:**
- Módulo `supabase/functions/_shared/validapay.ts` ✅ (já deployado):
  - `getValidaPayToken()` — busca token via `client_credentials`, cacheia em memória com margem de 60s
  - `validaPayFetch(path, options, subAccountNumber?)` — injeta `Authorization: Bearer` e opcionalmente `X-Sub-Account`
- Variáveis de ambiente (Supabase Dashboard — sandbox):
  - `VALIDAPAY_BASE_URL`
  - `VALIDAPAY_AUTH_URL`
  - `VALIDAPAY_CLIENT_ID`
  - `VALIDAPAY_CLIENT_SECRET`
- Escopos necessários: `pix.cob/write pix.cob/read wallet/write wallet/read proposals/write proposals/read subaccounts/read`

**Critérios de aceite:**
- [x] `getValidaPayToken()` retorna token válido no sandbox
- [x] `validaPayFetch()` retorna `401` corretamente se credenciais inválidas
- [x] Zero credenciais no frontend — tudo server-side

**Estimativa:** P — **CONCLUÍDO**

---

### US-02 — Onboarding do freelancer: criar subconta Valida Pay + coletar chave PIX

**Como** freelancer, **quero** completar meu onboarding financeiro ao fazer primeiro login **para** ter uma subconta Valida Pay aprovada e poder receber pagamentos pela plataforma.

**Endpoints Valida Pay utilizados:**
- `POST {{base_url}}/v1/proposals` — cria proposta de subconta PF com dados do freelancer
- `GET {{base_url}}/v1/proposals/:formId` — consulta status e obtém `urlDocumentscopy`

**O que implementar:**

**Frontend — Modal de onboarding em 3 etapas** (abre automaticamente se `validapay_onboarding_status === null`):
- **Etapa 1 — Endereço:** CEP com auto-fill via ViaCEP, rua, número, complemento, bairro, cidade, estado
- **Etapa 2 — Dados e chave PIX:**
  - Data de nascimento, nome da mãe
  - Faixa de renda (dropdown com códigos Valida Pay: `1DINP01`–`1DINP05`)
  - Ocupação (dropdown: `ONP01`–`ONP10`)
  - Faixa patrimonial (dropdown: `NWNP01`–`NWNP04`)
  - Checkbox Pessoa Politicamente Exposta
  - **Chave PIX:** tipo (CPF/Telefone/E-mail/Chave aleatória) + valor com validação por regex
- **Etapa 3 — KYC:** exibe botão "Enviar documentos" que abre `urlDocumentscopy` em nova aba
- Mini badge flutuante no canto inferior direito quando modal está fechado (enquanto `validapay_onboarding_status === null`)
- Não renderiza se `validapay_onboarding_status === 'aprovado'` ou `'em_analise'`

**Backend — Edge Function `create-subaccount/index.ts`** ✅ (já deployada):
- JWT auth — freelancer identificado pelo token (`auth.uid()`), nunca por campo no body
- Valida: freelancer existe, tem CPF, não está já aprovado
- Salva endereço em `profiles`, dados financeiros + `pix_key` + `pix_key_type` em `freelancers`
- Chama `POST /v1/proposals` com todos os dados
- Busca `GET /v1/proposals/:formId` para obter `urlDocumentscopy`
- Salva `validapay_form_id` e `validapay_onboarding_status = 'em_analise'`
- Retorna `{ ok: true, formId, urlDocumentscopy }`

**Por que coletar chave PIX no onboarding?**
A Valida Pay não permite que a master envie PIX diretamente para um CPF externo — só é possível sacar de uma subconta para uma chave PIX de mesma titularidade. A chave PIX coletada aqui será usada pela Edge Function `release-payment` no checkout, que chama `POST /v1/wallet/withdraw` com `accountId: validapay_account_number` + `pixKey: pix_key`.

**Triggers/migrations necessários:**
```sql
-- Endereço no perfil
ALTER TABLE profiles
  ADD COLUMN cep text,
  ADD COLUMN rua text,
  ADD COLUMN numero text,
  ADD COLUMN complemento text,
  ADD COLUMN bairro text,
  ADD COLUMN cidade text,
  ADD COLUMN estado text;

-- Dados financeiros + subconta + chave PIX no freelancer
ALTER TABLE freelancers
  ADD COLUMN faixa_renda text,
  ADD COLUMN ocupacao text,
  ADD COLUMN faixa_patrimonio text,
  ADD COLUMN nome_mae text,
  ADD COLUMN data_nascimento text,
  ADD COLUMN validapay_form_id text,
  ADD COLUMN validapay_account_number text,
  ADD COLUMN validapay_onboarding_status text
    CHECK (validapay_onboarding_status IN ('em_analise', 'aprovado', 'rejeitado')),
  ADD COLUMN pix_key text,
  ADD COLUMN pix_key_type text
    CHECK (pix_key_type IN ('cpf', 'telefone', 'email', 'chave_aleatoria'));

-- RLS: bloqueia candidatura sem subconta aprovada
-- (Adicionar à policy de INSERT em applications)
```

**Critérios de aceite:**
- [x] Freelancer sem onboarding vê modal ao entrar na área de extras
- [x] CEP auto-preenche campos via ViaCEP
- [x] Chave PIX validada por tipo (frontend + backend)
- [x] Edge Function chama `POST /v1/proposals` com sucesso no sandbox
- [x] `validapay_form_id`, `validapay_onboarding_status = 'em_analise'`, `pix_key` salvos
- [x] URL de KYC exibida como botão
- [x] Freelancer com `validapay_onboarding_status` preenchido não vê o modal
- [x] JWT identifica o usuário — nunca campo no body

**Estimativa:** G — **CONCLUÍDO**

---

### US-03 — Webhook `account_approved` → liberar freelancer na plataforma

**Como** plataforma, **quero** receber confirmação automática da Valida Pay quando a subconta do freelancer for aprovada **para** habilitar o freelancer a se candidatar a vagas.

**Endpoints Valida Pay utilizados:**
- Webhook recebido: evento `account_approved`

**O que implementar:**
- Edge Function `validapay-webhook/index.ts` (roteador central de eventos):
  - `account_approved` → busca freelancer por CPF (`documentNumber`), salva `validapay_account_number`, atualiza `validapay_onboarding_status = 'aprovado'`
  - `charge.paid` → tratado na US-05
  - Outros eventos → `200 OK` e ignora
  - Responde `200` imediatamente em todos os casos

**Segurança:** Validar assinatura HMAC do webhook (se Valida Pay suportar) antes de processar.

**Triggers/migrations necessários:** Nenhum adicional

**Critérios de aceite:**
- [ ] Webhook recebe `account_approved` e salva `validapay_account_number` pelo CPF
- [ ] `validapay_onboarding_status` muda para `'aprovado'`
- [ ] Freelancer aprovado consegue se candidatar (RLS + frontend verificam status)
- [ ] Responde `200` imediatamente

**Estimativa:** M
**Prioridade:** Alta

---

### US-04 — Gerar cobrança PIX com split ao aprovar candidato

**Como** empresa, **quero** que ao aprovar um candidato seja gerada automaticamente uma cobrança PIX com split **para** que R$10 fique na master do QueroExtra (taxa) e o valor líquido vá para a subconta do freelancer na Valida Pay.

**Endpoints Valida Pay utilizados:**
- `POST {{base_url}}/v1/charges/pix` — cobrança com split para subconta do freelancer

**O que implementar:**
- Edge Function `create-pix-charge/index.ts`:
  - Recebe `{ application_id }` — único parâmetro do frontend
  - Empresa autenticada via JWT (`auth.uid()`)
  - Validações em ordem:
    1. `application_id` pertence a uma vaga da empresa autenticada
    2. Candidatura com `status = 'aprovado'`
    3. Freelancer tem `validapay_account_number` preenchido (subconta aprovada)
    4. Sem `transaction` ativa para este `application_id` (idempotência)
  - Gera `idempotency_key = crypto.randomUUID()` e salva antes de chamar a API
  - Chama `POST /v1/charges/pix` com split:
    ```json
    {
      "amount": job.valor,
      "expiration": 3600,
      "customer": { "name": empresa.nome, "documentNumber": empresa.cnpj_cpf, "email": empresa.email, "phone": empresa.celular },
      "split": [
        { "type": "fixed", "amount": 10.00 },
        { "type": "fixed", "accountNumber": "validapay_account_number", "amount": job.valor - 10 }
      ],
      "metadata": { "externalId": "application_id" },
      "webhookUrl": "<SUPABASE_URL>/functions/v1/validapay-webhook"
    }
    ```
    Header: `X-Idempotency-Key: <idempotency_key>`
  - Cria `transactions` com `status = 'retido'`, `gateway_charge_id`, `emv`, `idempotency_key`
  - Retorna `{ chargeId, emv }` para o frontend

**Segurança anti-vulnerabilidade:**
- Todos os dados sensíveis (valor, empresa, freelancer, `validapay_account_number`) buscados do banco via service role — nunca aceitos do body
- Ownership validada: empresa autenticada = empresa da vaga
- `X-Idempotency-Key` — reenvio não gera cobrança duplicada
- Erro `FREELANCER_SUBCONTA_NOT_FOUND` se `validapay_account_number` não existe

**Triggers/migrations necessários:**
```sql
ALTER TABLE transactions
  ADD COLUMN application_id uuid REFERENCES applications ON DELETE RESTRICT,
  ADD COLUMN gateway_charge_id text,
  ADD COLUMN emv text,
  ADD COLUMN paid_at timestamptz,
  ADD COLUMN idempotency_key text UNIQUE,
  ADD COLUMN gateway_payment_id text;
```

**Critérios de aceite:**
- [ ] Aprovação dispara a Edge Function
- [ ] PIX com split criado corretamente (R$10 master + valor líquido para subconta)
- [ ] Ownership validada
- [ ] Segundo call com mesmo `application_id` retorna cobrança existente (idempotente)
- [ ] Erro se freelancer sem subconta aprovada
- [ ] `transactions` criada com `status = 'retido'`

**Estimativa:** G
**Prioridade:** Alta

---

### US-05 — Exibir QR Code PIX na tela da empresa

**Como** empresa, **quero** ver o QR Code PIX imediatamente após aprovar um candidato **para** pagar pelo app do banco na hora.

**Endpoints Valida Pay utilizados:**
- `GET {{base_url}}/v1/charges/:chargeId` — via Edge Function proxy

**O que implementar:**
- Componente `PixQrCodeModal.tsx` em `src/components/empresa/`:
  - QR Code renderizado a partir do `emv` (lib `qrcode.react`)
  - Código "copia e cola" copiável
  - Polling a cada 5s via Edge Function `check-pix-status` (nunca direto do frontend)
  - Ao detectar `PAID`: fecha modal, toast "Pagamento confirmado!"
  - Botão "Cancelar": Edge Function `cancel-pix-charge` → `DELETE /v1/charges/:chargeId` + `status = 'estornado'`
  - Expiração após 60 min com opção de regerar

**Critérios de aceite:**
- [ ] QR Code exibido imediatamente após aprovação
- [ ] Polling detecta `PAID` e fecha modal com feedback
- [ ] Cancelamento funciona e atualiza `status = 'estornado'`
- [ ] Frontend nunca chama Valida Pay diretamente

**Estimativa:** M
**Prioridade:** Alta

---

### US-06 — Webhook `charge.paid` → confirmar pagamento retido

**Como** plataforma, **quero** receber confirmação oficial da Valida Pay quando o PIX for pago **para** ter registro server-side independente do polling do frontend.

**Endpoints Valida Pay utilizados:**
- Webhook recebido: evento `charge.paid`

**O que implementar:**
- Handler `charge.paid` na Edge Function `validapay-webhook/index.ts`:
  - Busca `transaction` por `gateway_charge_id`
  - Atualiza `paid_at = now()` — status permanece `'retido'`
  - `charge.canceled` → `transactions.status = 'estornado'`
  - Responde `200` imediatamente

**Critérios de aceite:**
- [ ] `charge.paid` preenche `paid_at` e mantém `status = 'retido'`
- [ ] `charge.canceled` atualiza `status = 'estornado'`
- [ ] Responde `200` imediatamente

**Estimativa:** P
**Prioridade:** Alta

---

### US-07 — Checkout confirmado: master libera saque da subconta para chave PIX do freelancer

**Como** plataforma, **quero** que ao confirmar o checkout a master libere automaticamente o saque da subconta do freelancer para a chave PIX cadastrada **para** que o dinheiro caia na conta bancária dele sem intervenção manual.

**Endpoints Valida Pay utilizados:**
- `POST {{base_url}}/v1/wallet/withdraw` — saque da subconta do freelancer para chave PIX de mesma titularidade

**O que implementar:**

**Trigger + Edge Function `release-payment/index.ts`:**

Fluxo de segurança interno (ordem importa):
1. Recebe `{ application_id }` — chamado pelo trigger via `service_role_key`
2. Busca `transaction` do banco: valida `status = 'retido'` E `paid_at IS NOT NULL`
3. **Se `status != 'retido'` → aborta** (idempotência — previne double spend)
4. Busca do banco: `freelancer.validapay_account_number`, `freelancer.pix_key`, `freelancer.pix_key_type` — **NUNCA do body**
5. Calcula `valor_liquido = job.valor - 10.00`
6. Chama `POST /v1/wallet/withdraw` com `X-Idempotency-Key: transaction.idempotency_key`:
   ```json
   {
     "amount": valor_liquido,
     "pixKey": freelancer.pix_key,
     "pixKeyType": freelancer.pix_key_type,
     "accountId": freelancer.validapay_account_number
   }
   ```
   > A Valida Pay valida que a chave PIX pertence ao mesmo CPF da subconta (`accountId`). O master controla o timing — freelancer não tem API credentials para sacar sozinho.
7. Atualiza `transactions.status = 'liberado'` + `gateway_payment_id` **somente após** confirmação
8. Falha na API: mantém `status = 'retido'` + log de erro para retry

**Segurança anti-vulnerabilidade (crítico):**
- `pix_key`, `pix_key_type`, `validapay_account_number` sempre do banco — nunca do request body
- Double spend impossível: check no banco + `X-Idempotency-Key` na API
- `status = 'liberado'` gravado **após** confirmação (não otimista)
- Edge Function só chamável com `service_role_key` (trigger do banco) — não exposta ao frontend

**Migrations/triggers necessários:**
```sql
CREATE OR REPLACE FUNCTION trigger_release_payment_on_checkout()
RETURNS trigger AS $$
BEGIN
  IF NEW.tipo = 'checkout'
    AND NEW.confirmado_em IS NOT NULL
    AND OLD.confirmado_em IS NULL
  THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/release-payment',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object('application_id', NEW.application_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_liberar_pagamento_no_checkout
  AFTER UPDATE ON checkins
  FOR EACH ROW EXECUTE FUNCTION trigger_release_payment_on_checkout();
```

**Critérios de aceite:**
- [ ] Checkout confirmado dispara Edge Function automaticamente
- [ ] `wallet/withdraw` chamado com `accountId` da subconta + `pixKey` do banco (nunca do request)
- [ ] `status = 'liberado'` + `gateway_payment_id` após confirmação da Valida Pay
- [ ] Segunda chamada com mesmo `application_id` não gera segundo pagamento (idempotente)
- [ ] Falha mantém `status = 'retido'` + log de erro
- [ ] Trigger não dispara em check-ins e não dispara se `confirmado_em` já preenchido

**Estimativa:** G
**Prioridade:** Alta

---

### US-08 — Tela de carteira do freelancer (histórico de transações)

**Como** freelancer, **quero** ver meu histórico de pagamentos **para** acompanhar meus ganhos na plataforma.

**O que implementar:**
- Substituir mock em `CarteiraPage.tsx`:
  - Histórico de transações via `supabase.from('transactions')` (RLS garante isolamento)
  - Status visual: `retido` (amarelo — "Aguardando conclusão do serviço") / `liberado` (verde — "Pago via PIX") / `estornado` (cinza — "Cancelado")
  - Nome da empresa e vaga, valor líquido, data
  - Banner se `validapay_onboarding_status !== 'aprovado'`

```sql
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_own_transactions" ON transactions
  FOR SELECT USING (freelancer_id = auth.uid() OR empresa_id = auth.uid());
```

**Estimativa:** M
**Prioridade:** Média

---

## Regras de Negócio

| Regra | Valor |
|-------|-------|
| Valor mínimo de vaga | R$ 50,00 |
| Taxa da plataforma | R$ 10,00 fixo, retida na master via split |
| Modelo de pagamento | Split na cobrança + escrow via subconta |
| Quando o split ocorre | No momento do pagamento PIX pela empresa |
| Quando o freelancer recebe | Após checkout confirmado (master chama `wallet/withdraw`) |
| Quem controla o saque | Apenas a master — freelancer não tem API credentials |
| Pré-requisito para candidatura | `validapay_onboarding_status = 'aprovado'` (RLS + frontend) |

---

## Segurança — Princípios Aplicados

| Ponto de risco | Medida |
|----------------|--------|
| `pix_key` e `accountId` no pagamento | Sempre buscados do banco (service role), nunca do request body |
| Double spend | `status = 'retido'` verificado antes + `X-Idempotency-Key` na API |
| Identificação do usuário | JWT `auth.uid()` — nunca `freelancer_id` no body |
| Ownership da cobrança | Edge Function valida que `application_id` pertence à empresa autenticada |
| Candidatura sem subconta aprovada | RLS no banco + botão desabilitado no frontend |
| Timing do repasse | Master controla `wallet/withdraw` — freelancer não tem acesso à API |
| Webhook falso | Validar assinatura HMAC (se disponível na Valida Pay) |
| Credenciais Valida Pay | Apenas env vars do Supabase — zero no frontend |

---

## Migrations — Resumo

| Tabela | Colunas adicionadas |
|--------|---------------------|
| `profiles` | `cep`, `rua`, `numero`, `complemento`, `bairro`, `cidade`, `estado` |
| `freelancers` | `faixa_renda`, `ocupacao`, `faixa_patrimonio`, `nome_mae`, `data_nascimento`, `validapay_form_id`, `validapay_account_number`, `validapay_onboarding_status`, `pix_key`, `pix_key_type` |
| `transactions` | `application_id` (FK), `gateway_charge_id`, `emv`, `paid_at`, `idempotency_key`, `gateway_payment_id` |

---

## Edge Functions — Resumo

| Função | US | Status |
|--------|----|--------|
| `_shared/validapay.ts` | US-01 | ✅ Deployada |
| `create-subaccount` | US-02 | ✅ Deployada |
| `validapay-webhook` | US-03/06 | Pendente |
| `create-pix-charge` | US-04 | Pendente |
| `check-pix-status` | US-05 | Pendente |
| `cancel-pix-charge` | US-05 | Pendente |
| `release-payment` | US-07 | Pendente |

---

## Decisões e Gaps Pendentes

| Item | Status |
|------|--------|
| Assinatura HMAC de webhooks | ⚠️ Verificar se Valida Pay oferece |
| `pg_net` disponível no projeto | ⚠️ Verificar antes de criar trigger |
| Conflito com `trigger_auto_generate_checkout` | ⚠️ Inspecionar antes de criar o trigger |
| Taxa acima de R$200 | ⚠️ Definir com produto (R$10 fixo ou %?) |
| Freelancer pode atualizar chave PIX? | ⚠️ Definir (nova chave afeta subcontas em andamento?) |
| Sandbox aprova subcontas automaticamente? | ⚠️ Verificar para teste end-to-end |
