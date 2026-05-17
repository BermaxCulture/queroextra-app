-- =============================================================================
-- Migration: 005 — Trigger de criação de perfil no signup
-- Garante profiles + freelancers/companies mesmo quando o e-mail exige
-- confirmação (sem sessão no cliente após signUp).
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_tipo text;
  user_habilidades text[];
begin
  user_tipo := coalesce(new.raw_user_meta_data->>'tipo', 'freelancer');

  insert into public.profiles (id, tipo, nome, email, celular, status)
  values (
    new.id,
    user_tipo,
    new.raw_user_meta_data->>'nome',
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
    insert into public.companies (profile_id, status)
    values (new.id, 'pendente')
    on conflict (profile_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
