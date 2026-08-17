-- =============================================================================
-- Migration: 002 — Vagas, Candidaturas e Operações de Campo
-- Descrição: Cria o núcleo operacional da plataforma — jobs (vagas publicadas),
--            applications (candidaturas), checkins (controle de presença) e
--            reviews (avaliações mútuas pós-trabalho).
-- Depende de: 001_create_profiles_and_users
-- =============================================================================

-- -----------------------------------------------------------------------------
-- JOBS: Vagas publicadas pelas empresas
-- O valor mínimo de R$50 é garantido por constraint de check.
-- O status controla o ciclo de vida da vaga na plataforma.
-- -----------------------------------------------------------------------------
create table if not exists jobs (
  id           uuid        primary key default gen_random_uuid(),
  company_id   uuid        not null references companies on delete cascade,
  titulo       text        not null,
  local        text,
  valor        numeric     not null check (valor >= 50),
  data_inicio  timestamptz,
  data_fim     timestamptz,
  descricao    text,
  categoria    text,
  tags         text[],
  status       text        not null default 'aberta'
                           check (status in ('aberta', 'em_andamento', 'finalizada', 'cancelada')),
  urgente      boolean     not null default false,
  created_at   timestamptz not null default now()
);

comment on table  jobs             is 'Vagas de trabalho publicadas pelas empresas contratantes.';
comment on column jobs.company_id  is 'FK para companies — empresa que publicou a vaga.';
comment on column jobs.valor       is 'Valor total da vaga. Mínimo de R$ 50,00.';
comment on column jobs.tags        is 'Array de tags para filtragem e busca.';
comment on column jobs.status      is 'Ciclo de vida: aberta → em_andamento → finalizada | cancelada.';
comment on column jobs.urgente     is 'Destaca a vaga como urgente no feed.';

-- -----------------------------------------------------------------------------
-- APPLICATIONS: Candidaturas de freelancers às vagas
-- A constraint unique(job_id, freelancer_id) impede candidaturas duplicadas.
-- -----------------------------------------------------------------------------
create table if not exists applications (
  id             uuid        primary key default gen_random_uuid(),
  job_id         uuid        not null references jobs on delete cascade,
  freelancer_id  uuid        not null references freelancers on delete cascade,
  status         text        not null default 'pendente'
                             check (status in ('pendente', 'aprovado', 'rejeitado')),
  created_at     timestamptz not null default now(),

  constraint applications_unique unique (job_id, freelancer_id)
);

comment on table  applications                is 'Candidaturas de freelancers para vagas.';
comment on column applications.job_id         is 'FK para jobs — vaga à qual o freelancer se candidatou.';
comment on column applications.freelancer_id  is 'FK para freelancers — candidato.';
comment on column applications.status         is 'Status da candidatura: pendente, aprovado ou rejeitado.';

-- -----------------------------------------------------------------------------
-- CHECKINS: Registro de check-in e check-out por turno de trabalho
-- Cada registro representa um evento único (entrada ou saída).
-- O campo `codigo` é gerado para confirmação presencial.
-- -----------------------------------------------------------------------------
create table if not exists checkins (
  id              uuid        primary key default gen_random_uuid(),
  job_id          uuid        not null references jobs on delete cascade,
  application_id  uuid        not null references applications on delete cascade,
  codigo          text,
  tipo            text        not null check (tipo in ('checkin', 'checkout')),
  confirmado_em   timestamptz,
  created_at      timestamptz not null default now()
);

comment on table  checkins                 is 'Registro de entrada e saída de freelancers por turno.';
comment on column checkins.application_id  is 'FK para applications — candidatura aprovada para este turno.';
comment on column checkins.codigo          is 'Código gerado para confirmação presencial do check-in/checkout.';
comment on column checkins.tipo            is 'Tipo do evento: checkin (entrada) ou checkout (saída).';
comment on column checkins.confirmado_em   is 'Timestamp da confirmação presencial pelo responsável.';

-- -----------------------------------------------------------------------------
-- REVIEWS: Avaliações mútuas entre empresa e freelancer
-- Tanto empresa avalia freelancer quanto freelancer avalia empresa.
-- expires_at define o prazo para deixar a avaliação após o término da vaga.
-- -----------------------------------------------------------------------------
create table if not exists reviews (
  id           uuid        primary key default gen_random_uuid(),
  job_id       uuid        not null references jobs on delete cascade,
  avaliador_id uuid        not null references profiles on delete cascade,
  avaliado_id  uuid        not null references profiles on delete cascade,
  nota         integer     not null check (nota between 1 and 5),
  comentario   text,
  expires_at   timestamptz,
  created_at   timestamptz not null default now(),

  constraint reviews_unique unique (job_id, avaliador_id, avaliado_id)
);

comment on table  reviews              is 'Avaliações mútuas entre empresa e freelancer após conclusão da vaga.';
comment on column reviews.job_id       is 'FK para jobs — vaga que originou a avaliação.';
comment on column reviews.avaliador_id is 'FK para profiles — quem está avaliando.';
comment on column reviews.avaliado_id  is 'FK para profiles — quem está sendo avaliado.';
comment on column reviews.nota         is 'Nota de 1 a 5 estrelas.';
comment on column reviews.expires_at   is 'Prazo limite para submissão da avaliação.';

-- Índices de performance
create index if not exists idx_jobs_company_id      on jobs(company_id);
create index if not exists idx_jobs_status          on jobs(status);
create index if not exists idx_jobs_categoria       on jobs(categoria);
create index if not exists idx_applications_job_id  on applications(job_id);
create index if not exists idx_applications_fl_id   on applications(freelancer_id);
create index if not exists idx_checkins_job_id      on checkins(job_id);
create index if not exists idx_checkins_app_id      on checkins(application_id);
create index if not exists idx_reviews_job_id       on reviews(job_id);
create index if not exists idx_reviews_avaliado_id  on reviews(avaliado_id);
