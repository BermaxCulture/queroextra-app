# Correções Sprint 2 — Conformidade API + Segurança

Ordem: críticas primeiro. Check quando corrigido e deployado/testado.

---

## Vulnerabilidades de Segurança

### [x] V-01 — CRÍTICA: Webhook sem autenticação
**Risco:** Qualquer pessoa pode forjar um `POST` para `/validapay-webhook` aprovando freelancers ou marcando pagamentos como pagos.
**Arquivo:** `supabase/functions/validapay-webhook/index.ts`
**Correção:** Ao registrar webhook na Valida Pay usar `authToken`; verificar o header `Authorization` no handler antes de processar qualquer payload.
**Status:** Yslan implementou verificação de assinatura — **já deployado**. Confirmar qual header/formato é usado para simular testes.

---

### [x] V-02 — CRÍTICA: Double spend em `create-pix-charge`
**Risco:** Chamadas paralelas com mesmo `application_id` geram múltiplas cobranças.
**Arquivo:** `supabase/functions/create-pix-charge/index.ts`
**Correção:** Antes de chamar a Valida Pay, verificar `SELECT id FROM transactions WHERE application_id = $1 AND status IN ('pendente', 'retido')` e retornar 409 se existir.

---

### [x] V-03 — ALTA: Freelancer pode chamar `create-pix-charge`
**Risco:** Freelancer com JWT válido gera cobrança sem aprovação da empresa.
**Arquivo:** `supabase/functions/create-pix-charge/index.ts`
**Correção:** Verificar `profile.tipo === 'empresa'` logo após autenticar o JWT; retornar 403 se não for empresa.

---

### [x] V-04 — ALTA: Ownership não verificado em `create-pix-charge`
**Risco:** Empresa A pode gerar cobrança para candidatura de vaga da empresa B.
**Arquivo:** `supabase/functions/create-pix-charge/index.ts`
**Correção:** Após buscar o `job`, verificar que `job.company_id` pertence à empresa do usuário autenticado.

---

### [x] V-05 — ALTA: `create-subaccount` sem whitelist de valores no servidor
**Risco:** Freelancer pode enviar valores arbitrários em `faixa_renda`/`ocupacao`/`faixa_patrimonio`.
**Arquivo:** `supabase/functions/create-subaccount/index.ts`
**Correção:** Validar que os valores recebidos estão nos sets aceitos antes de mapear.

---

### [x] V-06 — MÉDIA: RLS não confirmada em `transactions`
**Risco:** Freelancer pode ler dados financeiros de outros usuários.
**Arquivo:** Migration SQL
**Correção:** `ALTER TABLE transactions ENABLE ROW LEVEL SECURITY` + policy de SELECT por `application_id` do próprio freelancer/empresa.

---

### [x] V-07 — MÉDIA: INSERT em `applications` sem check server-side de `onboarding_status`
**Risco:** Freelancer com status `em_analise` pode se candidatar via curl/DevTools.
**Arquivo:** RLS policy de `applications`
**Correção:** `WITH CHECK (freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = auth.uid() AND validapay_onboarding_status = 'aprovado'))`.

---

## Não-Conformidades com a API

### [x] NC-01 — `birthDate` formato errado
**Problema:** Frontend envia `DD-MM-YYYY`, API exige `YYYY-MM-DD`.
**Arquivo:** `supabase/functions/create-subaccount/index.ts`
**Correção:** `const [dd, mm, yyyy] = data_nascimento.split('-'); birthDate = \`${yyyy}-${mm}-${dd}\``
**Status:** ✅ Corrigido e deployado (v11)

---

### [x] NC-02 — `financialDetails.declaredIncome` com código interno
**Problema:** Enviava `"1DINP01"` — API exige valor real `"1000.00"`.
**Arquivo:** `supabase/functions/create-subaccount/index.ts`
**Correção:** Mapeamento `RENDA_MAP` de código → valor decimal.
**Status:** ✅ Corrigido e deployado (v11)

---

### [x] NC-03 — `financialDetails.occupation` com código interno
**Problema:** Enviava `"ONP01"` — API exige texto livre `"Autônomo"`.
**Arquivo:** `supabase/functions/create-subaccount/index.ts`
**Correção:** Mapeamento `OCUPACAO_MAP` de código → texto.
**Status:** ✅ Corrigido e deployado (v11)

---

### [x] NC-07 — Auth usa `application/x-www-form-urlencoded` em vez de `application/json`
**Arquivo:** `supabase/functions/_shared/validapay.ts`
**Correção:** Mudado para `Content-Type: application/json` + `JSON.stringify(...)`.
**Status:** ✅ Corrigido e deployado (v11)

---

### [ ] NC-04 — `pixKeyType` enum errado ao fazer saque
**Problema:** Banco salva `cpf`/`telefone`/`email`/`chave_aleatoria` — API exige `CPF`/`PHONE`/`EMAIL`/`EVP`.
**Arquivo:** `supabase/functions/request-withdrawal/index.ts` (US-08, ainda não implementado)
**Correção:** Mapear antes de chamar `wallet/withdraw`: `cpf→CPF`, `telefone→PHONE`, `email→EMAIL`, `chave_aleatoria→EVP`.
**Impacto:** Só afeta US-08 (saque). Não bloqueia onboarding nem PIX.

---

### [x] NC-05 — Endpoint de cobrança PIX errado
**Problema:** Código usa `/v1/charges/pix` — não existe. Correto é `POST /v1/charges` com `paymentMethod: "pix"`.
**Arquivo:** `supabase/functions/create-pix-charge/index.ts`
**Correção:** Mudar path e adicionar campo `paymentMethod: "pix"` no body.

---

### [x] NC-06 — Campo `title` obrigatório ausente em `create-pix-charge`
**Problema:** API exige `title` (2–100 chars) no body da cobrança.
**Arquivo:** `supabase/functions/create-pix-charge/index.ts`
**Correção:** Adicionar `title: \`Pagamento - ${job.titulo}\`` no body.

---

### [x] NC-08 — Eventos de webhook mapeados errados
**Problema:**
- Código trata `account_approved` → evento real é `onboarding.create` (com status `CONFIRMED`)
- Código trata `charge.paid` → evento real é `payment.success`
**Arquivo:** `supabase/functions/validapay-webhook/index.ts`
**Correção:** Atualizar os handlers para os nomes corretos dos eventos.

---

### [x] NC-09 — `GET /v1/proposals/:id` estrutura mudou
**Problema:** Código acessa `statusData?.proposalStatus?.urlDocumentscopy` mas `proposalStatus` agora é string (`"FINISHED"`). A URL de KYC chega via webhook `onboarding.documentscopy`.
**Arquivo:** `supabase/functions/create-subaccount/index.ts`
**Correção:** Remover a busca de `urlDocumentscopy` via GET; confiar no webhook `onboarding.documentscopy` para popular o campo.

---

### [x] NC-10 — `formId` pode ser undefined
**Problema:** Se a proposta retornar `UNFINISHED`, `formId` pode vir vazio e a segunda chamada vai para `/proposals/undefined`.
**Arquivo:** `supabase/functions/create-subaccount/index.ts`
**Correção:** Guard `if (!proposal.formId) return 502`.
**Status:** ✅ Corrigido e deployado (v11)

---

## Resumo de Status

| # | Severidade | Item | Status |
|---|---|---|---|
| V-01 | CRÍTICA | Webhook sem auth | ✅ Yslan implementou |
| V-02 | CRÍTICA | Double spend | ✅ create-pix-charge v8 |
| V-03 | ALTA | Freelancer chama create-pix-charge | ✅ create-pix-charge v8 |
| V-04 | ALTA | Ownership não verificado | ✅ create-pix-charge v8 |
| V-05 | ALTA | Sem whitelist server-side | ✅ create-subaccount v12 |
| V-06 | MÉDIA | RLS transactions | ✅ migration aplicada |
| V-07 | MÉDIA | RLS applications INSERT | ✅ migration aplicada |
| NC-01 | ALTA | birthDate formato | ✅ v11 |
| NC-02 | ALTA | declaredIncome código→valor | ✅ v11 |
| NC-03 | ALTA | occupation código→texto | ✅ v11 |
| NC-04 | MÉDIA | pixKeyType enum | ⏳ Pendente (US-08 não implementado) |
| NC-05 | ALTA | Endpoint PIX errado | ✅ create-pix-charge v8 |
| NC-06 | ALTA | title ausente em cobrança | ✅ create-pix-charge v8 |
| NC-07 | ALTA | Auth Content-Type | ✅ v11 |
| NC-08 | ALTA | Eventos webhook errados | ✅ validapay-webhook v9 |
| NC-09 | MÉDIA | proposalStatus estrutura | ✅ create-subaccount v12 |
| NC-10 | BAIXA | formId guard | ✅ v11 |
