-- =============================================================================
-- Migration: 007 — Empresa aprovada para publicar vagas + trigger empresa
-- =============================================================================

-- Atualiza trigger de signup com dados da empresa (etapa 1)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_tipo text;
  user_habilidades text[];
  user_nome text;
begin
  user_tipo := coalesce(new.raw_user_meta_data->>'tipo', 'freelancer');
  user_nome := coalesce(
    new.raw_user_meta_data->>'nome_empresa',
    new.raw_user_meta_data->>'nome'
  );

  insert into public.profiles (id, tipo, nome, email, celular, status)
  values (
    new.id,
    user_tipo,
    user_nome,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'celular',
      new.raw_user_meta_data->>'telefone'
    ),
    'ativo'
  )
  on conflict (id) do nothing;

  if user_tipo = 'freelancer' then
    if new.raw_user_meta_data->'habilidades' is not null
       and jsonb_typeof(new.raw_user_meta_data->'habilidades') = 'array' then
      select coalesce(array_agg(elem), '{}')
      into user_habilidades
      from jsonb_array_elements_text(new.raw_user_meta_data->'habilidades') as elem;
    else
      user_habilidades := '{}';
    end if;

    insert into public.freelancers (profile_id, cpf, habilidades)
    values (
      new.id,
      new.raw_user_meta_data->>'cpf',
      user_habilidades
    )
    on conflict (profile_id) do nothing;

  elsif user_tipo = 'empresa' then
    insert into public.companies (profile_id, cnpj_cpf, area, status)
    values (
      new.id,
      new.raw_user_meta_data->>'cnpj_cpf',
      new.raw_user_meta_data->>'area',
      'pendente'
    )
    on conflict (profile_id) do nothing;
  end if;

  return new;
end;
$$;

-- Apenas empresas com status aprovado podem criar vagas
drop policy if exists "jobs: inserção pela empresa dona" on jobs;

create policy "jobs: inserção pela empresa aprovada"
  on jobs for insert
  with check (
    exists (
      select 1 from companies c
      where c.id = company_id
        and c.profile_id = auth.uid()
        and c.status = 'aprovado'
    )
  );
