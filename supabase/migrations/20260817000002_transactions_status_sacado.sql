-- =============================================================================
-- Migration: Documenta o status 'sacado' na constraint de transactions
-- Descrição: request-withdrawal/index.ts e simulate-withdrawal/index.ts já
--            gravam status = 'sacado' há tempos, e a constraint no banco de
--            produção já aceita esse valor — mas nenhuma migration versionada
--            capturava isso (última a tocar a constraint, 20260614000000,
--            só tinha 'pendente','retido','liberado','estornado'). Se o
--            ambiente fosse recriado do zero a partir das migrations do
--            repo, o saque quebraria com violação de check constraint.
--            Torna o schema reprodutível.
-- =============================================================================

alter table transactions drop constraint if exists transactions_status_check;
alter table transactions add constraint transactions_status_check
  check (status in ('pendente', 'retido', 'liberado', 'sacado', 'estornado'));
