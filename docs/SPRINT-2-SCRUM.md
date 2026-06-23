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

### US-07 — Checkout confirmado: liberar saldo para saque do freelancer

**Como** plataforma, **quero** que ao confirmar o checkout o pagamento seja marcado como disponível para saque **para** que o freelancer possa sacar quando quiser pela carteira.

> ℹ️ **Modelo revisado:** Não há transferência automática pós-checkout. O checkout marca o pagamento como `liberado` no nosso banco — o freelancer acumula saldo e decide quando sacar via CarteirePage. O saque efetivo para o PIX acontece na US-08.

**O que implementar:**

**Trigger no banco (`trg_liberar_pagamento_no_checkout`):**
- Dispara em `AFTER UPDATE ON checkins` quando `tipo = 'checkout'` e `confirmado_em` é preenchido pela primeira vez
- Atualiza diretamente `transactions.status = 'liberado'` onde `application_id = NEW.application_id` e `status = 'retido'`
- Sem chamada de Edge Function — tudo resolvido no banco com segurança

```sql
CREATE OR REPLACE FUNCTION fn_liberar_pagamento_no_checkout()
RETURNS trigger AS $$
BEGIN
  IF NEW.tipo = 'checkout'
    AND NEW.confirmado_em IS NOT NULL
    AND OLD.confirmado_em IS NULL
  THEN
    UPDATE transactions
    SET status = 'liberado', liberado_em = now()
    WHERE application_id = NEW.application_id
      AND status = 'retido';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_liberar_pagamento_no_checkout
  AFTER UPDATE ON checkins
  FOR EACH ROW EXECUTE FUNCTION fn_liberar_pagamento_no_checkout();
```

**Segurança:**
- Trigger roda com `SECURITY DEFINER` — não pode ser chamado pelo frontend
- Só atualiza se `status = 'retido'` — idempotente, sem double-spend
- Só dispara uma vez: condição `OLD.confirmado_em IS NULL` garante isso

**Migrations necessárias:**
```sql
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS liberado_em timestamptz;
```

**Critérios de aceite:**
- [ ] Checkout confirmado muda `transactions.status` de `retido` → `liberado`
- [ ] `liberado_em` preenchido com timestamp da confirmação
- [ ] Segunda confirmação do mesmo checkout não altera nada (idempotente)
- [ ] Trigger não dispara em check-ins (`tipo != 'checkout'`)
- [ ] Frontend não consegue acionar diretamente

**Estimativa:** P
**Prioridade:** Alta

---

### US-08 — Carteira do freelancer: saldo disponível e saque via PIX

**Como** freelancer, **quero** ver meu saldo disponível e solicitar saque para minha chave PIX **para** receber os pagamentos acumulados quando quiser.

**Endpoints Valida Pay utilizados:**
- `POST {{base_url}}/v1/wallet/withdraw` — saque da subconta para chave PIX de mesma titularidade

**O que implementar:**

**Frontend — `CarteiraPage.tsx`:**
- Histórico de transações via `supabase.from('transactions')` (RLS garante isolamento)
- Status visual:
  - `retido` → amarelo — "Aguardando conclusão do serviço"
  - `liberado` → verde — "Disponível para saque"
  - `sacado` → azul — "Pago via PIX"
  - `estornado` → cinza — "Cancelado"
- Saldo disponível = soma das transações com `status = 'liberado'`
- **Botão "Sacar tudo"** (visível se saldo > 0): chama Edge Function `request-withdrawal`
- Banner se `validapay_onboarding_status !== 'aprovado'`

**Backend — Edge Function `request-withdrawal/index.ts`:**
1. Freelancer autenticado via JWT (`auth.uid()`)
2. Busca todas as `transactions` com `status = 'liberado'` do freelancer
3. Valida que há saldo disponível
4. Busca do banco: `freelancer.validapay_account_number`, `pix_key`, `pix_key_type` — **nunca do body**
5. Chama `POST /v1/wallet/withdraw` com `X-Idempotency-Key`:
   ```json
   { "accountId": validapay_account_number, "pixKey": pix_key }
   ```
   > A Valida Pay transfere o saldo disponível da subconta para a chave PIX de mesma titularidade (CPF)
6. Atualiza `transactions.status = 'sacado'` **somente após** confirmação da API
7. Falha: mantém `status = 'liberado'` + log de erro

**Segurança:**
- `accountId`, `pix_key`, `pix_key_type` sempre do banco — nunca aceitos do frontend
- Freelancer só acessa suas próprias transactions (RLS + JWT)
- `status = 'sacado'` gravado após confirmação (não otimista)

**Migrations necessárias:**
```sql
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS liberado_em timestamptz,
  DROP CONSTRAINT IF EXISTS transactions_status_check,
  ADD CONSTRAINT transactions_status_check
    CHECK (status IN ('pendente', 'retido', 'liberado', 'sacado', 'estornado'));

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_own_transactions" ON transactions
  FOR SELECT USING (
    application_id IN (
      SELECT id FROM applications WHERE freelancer_id = (
        SELECT id FROM freelancers WHERE profile_id = auth.uid()
      )
    )
  );
```

**Critérios de aceite:**
- [ ] Saldo disponível calculado corretamente (soma de `liberado`)
- [ ] Botão "Sacar" aparece só se saldo > 0 e subconta aprovada
- [ ] `wallet/withdraw` chamado com dados do banco (nunca do frontend)
- [ ] Após saque: `status = 'sacado'` e saldo zerado na tela
- [ ] Falha na API não muda status das transactions

**Estimativa:** G
**Prioridade:** Alta

---

## Regras de Negócio

| Regra | Valor |
|-------|-------|
| Valor mínimo de vaga | R$ 50,00 |
| Taxa da plataforma | R$ 10,00 fixo, retida na master via split |
| Modelo de pagamento | Split na cobrança + escrow via subconta |
| Quando o split ocorre | No momento do pagamento PIX pela empresa |
| Quando o pagamento é liberado | Após checkout confirmado (trigger atualiza `status = 'liberado'`) |
| Quando o freelancer recebe | Quando ele solicitar saque na CarteirePage (chama `wallet/withdraw`) |
| Quem controla o saque | Freelancer solicita via app; Edge Function chama a API com dados do banco |
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
| `request-withdrawal` | US-08 | Pendente |

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
