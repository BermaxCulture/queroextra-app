-- =============================================================================
-- Migration: US QUER-64 — Empresa bloqueia prestador (escopo: só aquela empresa)
-- Descrição: Uma empresa pode bloquear um prestador com quem teve má
--            experiência. O prestador deixa de ver/poder se candidatar às
--            vagas DAQUELA empresa, mas mantém acesso normal ao resto da
--            plataforma (outras empresas, perfil, carteira etc). Bloqueio é
--            silencioso — o prestador não é notificado nem enxerga o motivo.
-- Depende de: 20260514000001, 20260514000002, 20260514000003, 20260514000004
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. COMPANY_FREELANCER_BLOCKS
-- -----------------------------------------------------------------------------
create table if not exists company_freelancer_blocks (
  id             uuid        primary key default gen_random_uuid(),
  company_id     uuid        not null references companies on delete cascade,
  freelancer_id  uuid        not null references freelancers on delete cascade,
  reason         text,
  created_at     timestamptz not null default now(),
  created_by     uuid        references profiles(id),

  constraint company_freelancer_blocks_unique unique (company_id, freelancer_id)
);

comment on table  company_freelancer_blocks            is 'Bloqueio de um prestador por uma empresa específica — não afeta o acesso do prestador ao resto da plataforma.';
comment on column company_freelancer_blocks.company_id    is 'Empresa que bloqueou o prestador.';
comment on column company_freelancer_blocks.freelancer_id is 'Prestador bloqueado para vagas desta empresa.';
comment on column company_freelancer_blocks.reason         is 'Motivo interno do bloqueio — nunca exposto ao prestador (bloqueio silencioso).';
comment on column company_freelancer_blocks.created_by     is 'Perfil (dono da empresa ou admin) que criou o bloqueio.';

create index if not exists idx_cfb_company_id    on company_freelancer_blocks(company_id);
create index if not exists idx_cfb_freelancer_id on company_freelancer_blocks(freelancer_id);

alter table company_freelancer_blocks enable row level security;

-- Leitura: só a própria empresa (dona do bloqueio) ou admin — o prestador
-- bloqueado NUNCA tem acesso de leitura a esta tabela (bloqueio silencioso).
create policy "company_freelancer_blocks: leitura pela empresa dona ou admin"
  on company_freelancer_blocks for select
  using (
    is_admin()
    or exists (
      select 1 from companies c
      where c.id = company_freelancer_blocks.company_id
        and c.profile_id = auth.uid()
    )
  );

create policy "company_freelancer_blocks: inserção pela empresa dona"
  on company_freelancer_blocks for insert
  with check (
    exists (
      select 1 from companies c
      where c.id = company_id
        and c.profile_id = auth.uid()
    )
  );

create policy "company_freelancer_blocks: atualização pela empresa dona ou admin"
  on company_freelancer_blocks for update
  using (
    is_admin()
    or exists (
      select 1 from companies c
      where c.id = company_freelancer_blocks.company_id
        and c.profile_id = auth.uid()
    )
  );

-- Exclusão = desbloquear
create policy "company_freelancer_blocks: exclusão pela empresa dona ou admin"
  on company_freelancer_blocks for delete
  using (
    is_admin()
    or exists (
      select 1 from companies c
      where c.id = company_freelancer_blocks.company_id
        and c.profile_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 2. HELPER: is_blocked_by_company(company_id) — security definer, mesmo
--    padrão de is_admin(). Necessário porque uma policy em `jobs`/`applications`
--    não pode simplesmente subconsultar company_freelancer_blocks — o
--    prestador não tem policy de SELECT nela (por design), então a subquery
--    "crua" sempre voltaria vazia. O security definer resolve isso mantendo
--    a tabela inacessível diretamente ao prestador.
-- -----------------------------------------------------------------------------
create or replace function is_blocked_by_company(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from company_freelancer_blocks b
    join freelancers f on f.id = b.freelancer_id
    where b.company_id = target_company_id
      and f.profile_id = auth.uid()
  );
$$;

comment on function is_blocked_by_company(uuid) is
  'true se o freelancer autenticado atual está bloqueado pela empresa informada.';

revoke execute on function is_blocked_by_company(uuid) from anon;
revoke execute on function is_blocked_by_company(uuid) from public;
grant execute on function is_blocked_by_company(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. JOBS: prestador bloqueado por uma empresa deixa de ver as vagas ABERTAS
--    dela (empresa continua vendo suas próprias vagas normalmente; admin
--    continua vendo tudo).
-- -----------------------------------------------------------------------------
drop policy if exists "jobs: leitura" on jobs;

create policy "jobs: leitura"
  on jobs for select
  using (
    (status = 'aberta' and not is_blocked_by_company(jobs.company_id))
    or is_admin()
    or exists (
      select 1 from companies c
      where c.id = jobs.company_id
        and c.profile_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 4. APPLICATIONS: prestador bloqueado não consegue se candidatar a vagas
--    daquela empresa (defesa em profundidade — reforça o que o passo 3 já
--    esconde na listagem).
-- -----------------------------------------------------------------------------
drop policy if exists "applications: inserção pelo freelancer" on applications;

create policy "applications: inserção pelo freelancer"
  on applications for insert
  with check (
    not is_blocked_by_company((select company_id from jobs where id = job_id))
    and freelancer_id in (
      select id from freelancers
      where profile_id = auth.uid()
        and validapay_onboarding_status = 'aprovado'
    )
  );
