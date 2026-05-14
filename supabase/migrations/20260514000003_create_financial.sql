-- =============================================================================
-- Migration: 003 — Financeiro (Carteira e Transações)
-- Descrição: Cria o sistema financeiro da plataforma — wallets (carteira do
--            freelancer com saldo retido/disponível) e transactions (registro
--            de cada pagamento processado via Stripe).
-- Depende de: 001_create_profiles_and_users, 002_create_jobs_and_operations
-- =============================================================================

-- -----------------------------------------------------------------------------
-- WALLETS: Carteira financeira de cada freelancer
-- Relação 1:1 com freelancers (garantida por unique constraint).
-- O saldo representa o valor disponível para saque.
-- -----------------------------------------------------------------------------
create table if not exists wallets (
  id             uuid        primary key default gen_random_uuid(),
  freelancer_id  uuid        not null references freelancers on delete cascade,
  saldo          numeric     not null default 0 check (saldo >= 0),
  created_at     timestamptz not null default now(),

  constraint wallets_freelancer_unique unique (freelancer_id)
);

comment on table  wallets               is 'Carteira financeira de cada freelancer na plataforma.';
comment on column wallets.freelancer_id is 'FK para freelancers (1:1) — cada freelancer tem exatamente 1 carteira.';
comment on column wallets.saldo         is 'Saldo disponível para saque. Não pode ser negativo.';

-- -----------------------------------------------------------------------------
-- TRANSACTIONS: Registro de todas as movimentações financeiras
-- Vinculada à vaga (job_id) que gerou o pagamento.
-- Os campos de valor permitem rastrear bruto, taxa e líquido separadamente.
-- stripe_payment_intent rastreia o pagamento no Stripe para reconciliação.
-- Status controla o fluxo: retido (aguardando) → liberado | estornado.
-- -----------------------------------------------------------------------------
create table if not exists transactions (
  id                     uuid        primary key default gen_random_uuid(),
  job_id                 uuid        not null references jobs on delete restrict,
  valor_bruto            numeric     not null check (valor_bruto > 0),
  taxa_plataforma        numeric     not null default 0 check (taxa_plataforma >= 0),
  valor_liquido          numeric     not null check (valor_liquido >= 0),
  status                 text        not null
                                     check (status in ('retido', 'liberado', 'estornado')),
  stripe_payment_intent  text,
  created_at             timestamptz not null default now()
);

comment on table  transactions                        is 'Registro financeiro de cada pagamento processado pela plataforma.';
comment on column transactions.job_id                 is 'FK para jobs — vaga que originou este pagamento.';
comment on column transactions.valor_bruto            is 'Valor total pago pela empresa (sem descontos).';
comment on column transactions.taxa_plataforma        is 'Taxa cobrada pela plataforma (ex: 15% do valor bruto).';
comment on column transactions.valor_liquido          is 'Valor líquido repassado ao freelancer (bruto - taxa).';
comment on column transactions.status                 is 'Fluxo financeiro: retido → liberado após conclusão | estornado em caso de cancelamento.';
comment on column transactions.stripe_payment_intent  is 'ID do PaymentIntent no Stripe para rastreamento e reconciliação.';

-- Índices de performance
create index if not exists idx_wallets_freelancer_id       on wallets(freelancer_id);
create index if not exists idx_transactions_job_id         on transactions(job_id);
create index if not exists idx_transactions_status         on transactions(status);
create index if not exists idx_transactions_stripe_intent  on transactions(stripe_payment_intent);
