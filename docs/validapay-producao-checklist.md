# Checklist: troca Valida Pay sandbox → produção (QUER-68)

## Onde ficam as credenciais

As credenciais da Valida Pay **nunca** ficam no repositório nem no `.env` do
frontend. Elas são segredos de Edge Function no Supabase (Dashboard → Edge
Functions → Secrets, ou `supabase secrets set`):

| Variável | Uso | Onde trocar |
|---|---|---|
| `VALIDAPAY_AUTH_URL` | URL de obtenção de token OAuth2 | Secret de Edge Function |
| `VALIDAPAY_CLIENT_ID` | Client ID da conta Valida Pay | Secret de Edge Function |
| `VALIDAPAY_CLIENT_SECRET` | Client secret | Secret de Edge Function |
| `VALIDAPAY_BASE_URL` | Base da API (contém `sandbox` ou não — é o que decide o ambiente) | Secret de Edge Function |
| `VALIDAPAY_WEBHOOK_SECRET` | **Novo** (ver abaixo) — segredo compartilhado do webhook | Secret de Edge Function |
| `VITE_VALIDAPAY_ENV` | Só controla textos/gates de UI (`sandbox`/`production`) | `.env` do frontend |

O ambiente (sandbox vs. produção) é decidido **só** por `VALIDAPAY_BASE_URL`
conter ou não a string `"sandbox"` — é isso que gateia as funções
`simulate-approval`, `simulate-payment` e `simulate-withdrawal` (retornam 403
fora de sandbox). Não há uma segunda flag para sincronizar.

## Passo a passo para ir para produção

1. Obter credenciais de produção da Valida Pay (client id/secret, auth url,
   base url) com o time da Valida Pay.
2. Atualizar os secrets de Edge Function no Supabase (dashboard do projeto,
   nunca via commit):
   ```
   supabase secrets set VALIDAPAY_AUTH_URL=... VALIDAPAY_CLIENT_ID=... \
     VALIDAPAY_CLIENT_SECRET=... VALIDAPAY_BASE_URL=... VALIDAPAY_WEBHOOK_SECRET=...
   ```
3. Gerar um valor aleatório forte para `VALIDAPAY_WEBHOOK_SECRET` (ex:
   `openssl rand -hex 32`) — ver justificativa de segurança abaixo.
4. Redeploy das edge functions (`supabase functions deploy`) para pegar os
   novos secrets.
5. Atualizar `VITE_VALIDAPAY_ENV=production` no ambiente de deploy do
   frontend (Vercel/Netlify/etc — não no `.env` local).
6. **Reonboardar/reaprovar subcontas de freelancers em produção**: subcontas
   criadas em sandbox não existem em produção — cada freelancer precisa
   refazer o onboarding (`create-subaccount`) apontando para a base de
   produção antes de poder receber pagamentos reais.
7. Testar o fluxo ponta a ponta em produção usando o **modo de teste de PIX**
   (QUER-69, painel Admin → Pagamentos) para não gastar o valor cheio da vaga
   a cada teste: geração de cobrança → pagamento real de baixo valor →
   confirmação via webhook → liberação no checkout → saque.
8. **Desativar o modo de teste de PIX assim que a validação terminar** — ele
   fica visualmente sinalizado no admin enquanto ligado, mas o toggle é
   global (afeta qualquer cobrança gerada enquanto ativo).

## Rollback (voltar para sandbox)

Reverter os secrets do passo 2 para os valores de sandbox e fazer redeploy
das functions + `VITE_VALIDAPAY_ENV=sandbox` no frontend. Como o ambiente é
inteiramente decidido pelos secrets (não há estado misto salvo no banco),
isso é reversível a qualquer momento sem migração.

## Achado de segurança: webhook sem assinatura

A Valida Pay **não assina** o payload do webhook (sem HMAC nem `authToken`
por proposta — não documentado em `docs/validaPay-guide.md`). Antes desta
mudança, `validapay-webhook` aceitava qualquer POST — qualquer pessoa que
descobrisse a URL poderia forjar um evento `payment.success` e liberar o
pagamento de uma candidatura sem pagar de verdade.

Mitigação aplicada (já no código, falta só configurar em produção): um
segredo compartilhado é anexado como query param na `webhookUrl` registrada
em `create-subaccount` (`?secret=...`), e `validapay-webhook` rejeita
requisições sem o segredo correto — **mas só quando
`VALIDAPAY_WEBHOOK_SECRET` está configurado**. Sem o secret configurado, o
comportamento antigo (aceitar tudo) é mantido, para não quebrar sandbox
retroativamente.

**Importante**: subcontas cujo onboarding já foi feito *antes* de configurar
`VALIDAPAY_WEBHOOK_SECRET` têm a `webhookUrl` antiga (sem o secret) já
registrada na Valida Pay — o webhook delas será rejeitado depois que o
secret for exigido. Confirmar com a Valida Pay se existe endpoint para
atualizar a `webhookUrl` de uma proposta já aprovada, ou reservar esse
detalhe para quando o onboarding de produção for feito do zero (item 6
acima), já com o secret configurado desde o início.

## Pendência técnica encontrada durante a auditoria

`transactions.paid_at` era referenciada em `validapay-webhook/index.ts` e
`simulate-payment/index.ts` sem existir em nenhuma migration versionada —
adicionado agora em `20260729000003_us_quer68_transactions_paid_at.sql`
(idempotente, não quebra se a coluna já existir no banco real).
