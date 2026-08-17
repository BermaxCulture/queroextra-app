-- =============================================================================
-- Migration: US QUER-69 — Configuração de valor de PIX de teste no admin
-- Descrição: Cria tabela genérica de configurações do sistema (app_settings,
--            admin-only) e a chave "pix_test_mode", além de uma coluna de
--            auditoria em transactions para marcar cobranças de teste.
-- Depende de: 20260514000001, 20260514000003, 20260514000004
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. APP_SETTINGS: configurações do sistema, chave/valor (jsonb).
--    Somente admin lê e escreve — a service role (edge functions) sempre
--    tem acesso irrestrito e não passa por RLS.
-- -----------------------------------------------------------------------------
create table if not exists app_settings (
  key         text        primary key,
  value       jsonb       not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid        references profiles(id)
);

comment on table  app_settings            is 'Configurações administráveis do sistema (chave/valor).';
comment on column app_settings.key        is 'Identificador único da configuração, ex: pix_test_mode.';
comment on column app_settings.value      is 'Valor da configuração em JSON.';
comment on column app_settings.updated_by is 'Admin (profiles.id) que fez a última alteração.';

alter table app_settings enable row level security;

create policy "app_settings: leitura apenas admin"
  on app_settings for select
  using ( is_admin() );

create policy "app_settings: inserção apenas admin"
  on app_settings for insert
  with check ( is_admin() );

create policy "app_settings: atualização apenas admin"
  on app_settings for update
  using ( is_admin() );

create policy "app_settings: exclusão apenas admin"
  on app_settings for delete
  using ( is_admin() );

-- Semente: modo de teste de PIX começa desativado, com R$1,00 como valor sugerido.
insert into app_settings (key, value)
values ('pix_test_mode', jsonb_build_object('enabled', false, 'amount_cents', 100))
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- 2. TRANSACTIONS: flag para identificar cobranças geradas em modo de teste.
--    O valor efetivo do teste é sempre decidido no backend (create-pix-charge),
--    nunca confiando em um flag vindo do client.
-- -----------------------------------------------------------------------------
alter table transactions
  add column if not exists is_test boolean not null default false;

comment on column transactions.is_test is
  'true quando a cobrança foi gerada com o valor reduzido do modo de teste PIX (ver app_settings.pix_test_mode).';

create index if not exists idx_transactions_is_test on transactions(is_test) where is_test;
