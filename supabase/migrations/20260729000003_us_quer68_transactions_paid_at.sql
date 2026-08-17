-- =============================================================================
-- Migration: US QUER-68 — Corrige coluna transactions.paid_at ausente
-- Descrição: validapay-webhook/index.ts e simulate-payment/index.ts já
--            gravam transactions.paid_at, mas nenhuma migration versionada
--            criava essa coluna (provavelmente adicionada manualmente via
--            dashboard/CLI em algum momento). Torna o schema reprodutível.
-- =============================================================================

alter table transactions
  add column if not exists paid_at timestamptz;

comment on column transactions.paid_at is
  'Data/hora em que o pagamento PIX foi confirmado pelo webhook da Valida Pay.';
