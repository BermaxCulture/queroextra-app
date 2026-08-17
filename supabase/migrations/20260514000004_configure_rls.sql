-- =============================================================================
-- Migration: 004 — Row Level Security (RLS) em todas as tabelas
-- Descrição: Habilita RLS e define as políticas de acesso por tabela.
--            Garante que cada usuário acessa apenas seus próprios dados.
-- Depende de: 001, 002, 003
-- =============================================================================

-- -----------------------------------------------------------------------------
-- HELPER: Função auxiliar para verificar se o usuário atual é admin
-- Usada em todas as políticas abaixo. security definer = roda com permissão
-- do criador (postgres), evitando recursão de RLS na tabela profiles.
-- -----------------------------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and tipo = 'admin'
  );
$$;

comment on function is_admin() is
  'Retorna true se o usuário autenticado atual tem tipo = admin na tabela profiles.';

-- Segurança: revoga acesso público (anon não deve chamar diretamente via REST)
revoke execute on function is_admin() from anon;
revoke execute on function is_admin() from public;

-- Apenas usuários autenticados (necessário para as policies de RLS)
grant execute on function is_admin() to authenticated;

-- =============================================================================
-- PROFILES
-- Regras: usuário lê/edita apenas o próprio perfil. Admin lê e edita todos.
-- =============================================================================
alter table profiles enable row level security;

-- Leitura: próprio perfil ou admin
create policy "profiles: leitura própria ou admin"
  on profiles for select
  using ( id = auth.uid() or is_admin() );

-- Inserção: apenas o próprio usuário cria seu perfil (chamado no signup)
create policy "profiles: inserção própria"
  on profiles for insert
  with check ( id = auth.uid() );

-- Atualização: próprio perfil ou admin
create policy "profiles: atualização própria ou admin"
  on profiles for update
  using ( id = auth.uid() or is_admin() );

-- Exclusão: apenas admin
create policy "profiles: exclusão apenas admin"
  on profiles for delete
  using ( is_admin() );

-- =============================================================================
-- COMPANIES
-- Regras: empresa lê/edita apenas seus dados. Admin lê e edita todos.
-- =============================================================================
alter table companies enable row level security;

-- Leitura: empresa dona (profile_id = uid) ou admin
create policy "companies: leitura própria ou admin"
  on companies for select
  using ( profile_id = auth.uid() or is_admin() );

-- Inserção: empresa só cria registro com seu próprio profile_id
create policy "companies: inserção própria"
  on companies for insert
  with check ( profile_id = auth.uid() );

-- Atualização: empresa dona ou admin
create policy "companies: atualização própria ou admin"
  on companies for update
  using ( profile_id = auth.uid() or is_admin() );

-- Exclusão: apenas admin
create policy "companies: exclusão apenas admin"
  on companies for delete
  using ( is_admin() );

-- =============================================================================
-- FREELANCERS
-- Regras: freelancer lê/edita apenas seus dados. Admin lê e edita todos.
-- =============================================================================
alter table freelancers enable row level security;

-- Leitura: freelancer dono (profile_id = uid) ou admin
create policy "freelancers: leitura própria ou admin"
  on freelancers for select
  using ( profile_id = auth.uid() or is_admin() );

-- Inserção: freelancer só cria registro com seu próprio profile_id
create policy "freelancers: inserção própria"
  on freelancers for insert
  with check ( profile_id = auth.uid() );

-- Atualização: freelancer dono ou admin
create policy "freelancers: atualização própria ou admin"
  on freelancers for update
  using ( profile_id = auth.uid() or is_admin() );

-- Exclusão: apenas admin
create policy "freelancers: exclusão apenas admin"
  on freelancers for delete
  using ( is_admin() );

-- =============================================================================
-- JOBS
-- Regras: qualquer autenticado lê vagas abertas.
--         Empresa lê todas as suas vagas (qualquer status).
--         Empresa cria/edita apenas suas próprias vagas.
--         Admin lê e edita tudo.
-- =============================================================================
alter table jobs enable row level security;

-- Leitura: vaga aberta para qualquer autenticado | empresa dona | admin
create policy "jobs: leitura"
  on jobs for select
  using (
    status = 'aberta'
    or is_admin()
    or exists (
      select 1 from companies c
      where c.id = jobs.company_id
        and c.profile_id = auth.uid()
    )
  );

-- Inserção: empresa cria vaga apenas vinculada à sua própria company
create policy "jobs: inserção pela empresa dona"
  on jobs for insert
  with check (
    exists (
      select 1 from companies c
      where c.id = company_id
        and c.profile_id = auth.uid()
    )
  );

-- Atualização: empresa dona ou admin
create policy "jobs: atualização pela empresa dona ou admin"
  on jobs for update
  using (
    is_admin()
    or exists (
      select 1 from companies c
      where c.id = jobs.company_id
        and c.profile_id = auth.uid()
    )
  );

-- Exclusão: apenas admin
create policy "jobs: exclusão apenas admin"
  on jobs for delete
  using ( is_admin() );

-- =============================================================================
-- APPLICATIONS
-- Regras: freelancer cria candidatura e lê as suas.
--         Empresa lê candidaturas das suas vagas.
--         Sem edição direta (apenas via function). Admin lê tudo.
-- =============================================================================
alter table applications enable row level security;

-- Leitura: freelancer vê as suas | empresa vê das suas vagas | admin vê tudo
create policy "applications: leitura"
  on applications for select
  using (
    is_admin()
    or exists (
      select 1 from freelancers f
      where f.id = applications.freelancer_id
        and f.profile_id = auth.uid()
    )
    or exists (
      select 1 from jobs j
      join companies c on c.id = j.company_id
      where j.id = applications.job_id
        and c.profile_id = auth.uid()
    )
  );

-- Inserção: freelancer cria candidatura com o próprio freelancer_id
create policy "applications: inserção pelo freelancer"
  on applications for insert
  with check (
    exists (
      select 1 from freelancers f
      where f.id = freelancer_id
        and f.profile_id = auth.uid()
    )
  );

-- Atualização: apenas admin (status gerenciado por functions)
create policy "applications: atualização apenas admin"
  on applications for update
  using ( is_admin() );

-- Exclusão: apenas admin
create policy "applications: exclusão apenas admin"
  on applications for delete
  using ( is_admin() );

-- =============================================================================
-- CHECKINS
-- Regras: empresa e freelancer leem os do turno em que estão envolvidos.
--         Empresa insere (confirma presença). Admin lê e edita tudo.
-- =============================================================================
alter table checkins enable row level security;

-- Leitura: freelancer da candidatura | empresa da vaga | admin
create policy "checkins: leitura"
  on checkins for select
  using (
    is_admin()
    or exists (
      select 1 from applications a
      join freelancers f on f.id = a.freelancer_id
      where a.id = checkins.application_id
        and f.profile_id = auth.uid()
    )
    or exists (
      select 1 from jobs j
      join companies c on c.id = j.company_id
      where j.id = checkins.job_id
        and c.profile_id = auth.uid()
    )
  );

-- Inserção: empresa dona da vaga ou admin (empresa confirma presença)
create policy "checkins: inserção pela empresa ou admin"
  on checkins for insert
  with check (
    is_admin()
    or exists (
      select 1 from jobs j
      join companies c on c.id = j.company_id
      where j.id = job_id
        and c.profile_id = auth.uid()
    )
  );

-- Atualização: apenas admin
create policy "checkins: atualização apenas admin"
  on checkins for update
  using ( is_admin() );

-- Exclusão: apenas admin
create policy "checkins: exclusão apenas admin"
  on checkins for delete
  using ( is_admin() );

-- =============================================================================
-- REVIEWS
-- Regras: qualquer autenticado lê reviews.
--         Avaliador cria apenas a sua review. Reviews são imutáveis.
--         Admin lê e exclui tudo.
-- =============================================================================
alter table reviews enable row level security;

-- Leitura: qualquer usuário autenticado (reviews são públicas)
create policy "reviews: leitura por autenticados"
  on reviews for select
  using ( auth.uid() is not null );

-- Inserção: avaliador só cria review com seu próprio avaliador_id
create policy "reviews: inserção pelo avaliador"
  on reviews for insert
  with check ( avaliador_id = auth.uid() );

-- Sem UPDATE — reviews são imutáveis por design
-- Exclusão: apenas admin
create policy "reviews: exclusão apenas admin"
  on reviews for delete
  using ( is_admin() );

-- =============================================================================
-- WALLETS
-- Regras: freelancer lê apenas sua carteira.
--         Inserção/atualização apenas pelo sistema (admin).
-- =============================================================================
alter table wallets enable row level security;

-- Leitura: freelancer dono | admin
create policy "wallets: leitura própria ou admin"
  on wallets for select
  using (
    is_admin()
    or exists (
      select 1 from freelancers f
      where f.id = wallets.freelancer_id
        and f.profile_id = auth.uid()
    )
  );

-- Inserção: apenas admin/sistema (wallets criadas automaticamente)
create policy "wallets: inserção apenas admin"
  on wallets for insert
  with check ( is_admin() );

-- Atualização: apenas admin/sistema (saldo gerenciado por functions)
create policy "wallets: atualização apenas admin"
  on wallets for update
  using ( is_admin() );

-- Exclusão: apenas admin
create policy "wallets: exclusão apenas admin"
  on wallets for delete
  using ( is_admin() );

-- =============================================================================
-- TRANSACTIONS
-- Regras: freelancer e empresa leem transações das suas vagas.
--         Inserção/atualização apenas pelo sistema (admin).
--         Admin lê tudo.
-- =============================================================================
alter table transactions enable row level security;

-- Leitura: empresa da vaga | freelancer aprovado na vaga | admin
create policy "transactions: leitura"
  on transactions for select
  using (
    is_admin()
    or exists (
      select 1 from jobs j
      join companies c on c.id = j.company_id
      where j.id = transactions.job_id
        and c.profile_id = auth.uid()
    )
    or exists (
      select 1 from jobs j
      join applications a on a.job_id = j.id
      join freelancers f on f.id = a.freelancer_id
      where j.id = transactions.job_id
        and f.profile_id = auth.uid()
    )
  );

-- Inserção: apenas admin/sistema (criado pelo backend após pagamento)
create policy "transactions: inserção apenas admin"
  on transactions for insert
  with check ( is_admin() );

-- Atualização: apenas admin/sistema
create policy "transactions: atualização apenas admin"
  on transactions for update
  using ( is_admin() );

-- Exclusão: apenas admin
create policy "transactions: exclusão apenas admin"
  on transactions for delete
  using ( is_admin() );
