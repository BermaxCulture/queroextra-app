-- =============================================================================
-- Migration: 001 — Perfis e Dados de Usuários
-- Descrição: Cria as tabelas base de identidade: profiles (todos os usuários),
--            companies (dados específicos de empresa) e
--            freelancers (dados específicos de freelancer).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PROFILES: Tabela central de todos os usuários autenticados
-- Vinculada ao auth.users do Supabase (1:1).
-- O campo `tipo` define o papel do usuário na plataforma.
-- -----------------------------------------------------------------------------
create table if not exists profiles (
  id          uuid        primary key references auth.users on delete cascade,
  tipo        text        not null check (tipo in ('freelancer', 'empresa', 'admin')),
  nome        text,
  email       text,
  avatar_url  text,
  celular     text,
  status      text        not null default 'ativo',
  created_at  timestamptz not null default now()
);

comment on table  profiles             is 'Perfil público de todos os usuários da plataforma.';
comment on column profiles.id          is 'Referencia auth.users — mesmo UUID do Supabase Auth.';
comment on column profiles.tipo        is 'Papel do usuário: freelancer, empresa ou admin.';
comment on column profiles.status      is 'Status da conta: ativo, suspenso, etc.';

-- -----------------------------------------------------------------------------
-- COMPANIES: Dados complementares de empresas contratantes
-- Cada empresa tem exatamente 1 perfil (profile_id unique).
-- O campo `status` controla o fluxo de aprovação do cadastro.
-- -----------------------------------------------------------------------------
create table if not exists companies (
  id              uuid        primary key default gen_random_uuid(),
  profile_id      uuid        not null references profiles on delete cascade,
  cnpj_cpf        text,
  area            text,
  documento_url   text[],
  status          text        not null default 'pendente'
                              check (status in ('pendente', 'aprovado', 'rejeitado', 'bloqueado')),
  created_at      timestamptz not null default now(),

  constraint companies_profile_unique unique (profile_id)
);

comment on table  companies                is 'Dados específicos de empresas contratantes.';
comment on column companies.profile_id     is 'FK para profiles — cada empresa tem um perfil único.';
comment on column companies.cnpj_cpf       is 'Documento de identificação da empresa (CNPJ ou CPF para MEI).';
comment on column companies.documento_url  is 'Array de URLs de documentos de verificação enviados.';
comment on column companies.status         is 'Status de verificação da empresa pelo admin.';

-- -----------------------------------------------------------------------------
-- FREELANCERS: Dados complementares de profissionais freelancers
-- Cada freelancer tem exatamente 1 perfil (profile_id unique).
-- stripe_account_id é preenchido após onboarding de pagamento.
-- -----------------------------------------------------------------------------
create table if not exists freelancers (
  id                 uuid        primary key default gen_random_uuid(),
  profile_id         uuid        not null references profiles on delete cascade,
  cpf                text,
  habilidades        text[],
  stripe_account_id  text,
  created_at         timestamptz not null default now(),

  constraint freelancers_profile_unique unique (profile_id)
);

comment on table  freelancers                    is 'Dados específicos de profissionais freelancers.';
comment on column freelancers.profile_id         is 'FK para profiles — cada freelancer tem um perfil único.';
comment on column freelancers.habilidades        is 'Array de habilidades/categorias do freelancer.';
comment on column freelancers.stripe_account_id  is 'ID da conta Stripe Connect para recebimento de pagamentos.';

-- Índices de performance
create index if not exists idx_companies_profile_id   on companies(profile_id);
create index if not exists idx_freelancers_profile_id on freelancers(profile_id);
create index if not exists idx_profiles_tipo          on profiles(tipo);
create index if not exists idx_profiles_status        on profiles(status);
