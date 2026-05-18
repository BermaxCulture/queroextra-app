-- =============================================================================
-- Migration: 006 — Storage buckets avatars e company-docs
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/jpg']
  ),
  (
    'company-docs',
    'company-docs',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- AVATARS: usuário autenticado faz upload na própria pasta; leitura pública
-- -----------------------------------------------------------------------------
drop policy if exists "avatars: leitura pública" on storage.objects;
drop policy if exists "avatars: upload próprio" on storage.objects;
drop policy if exists "avatars: atualização própria" on storage.objects;
drop policy if exists "avatars: exclusão própria" on storage.objects;
drop policy if exists "company-docs: leitura dono ou admin" on storage.objects;
drop policy if exists "company-docs: upload próprio" on storage.objects;
drop policy if exists "company-docs: atualização própria ou admin" on storage.objects;
drop policy if exists "company-docs: exclusão própria ou admin" on storage.objects;

create policy "avatars: leitura pública"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "avatars: upload próprio"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: atualização própria"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: exclusão própria"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- -----------------------------------------------------------------------------
-- COMPANY-DOCS: bucket privado — dono e admin
-- -----------------------------------------------------------------------------
create policy "company-docs: leitura dono ou admin"
  on storage.objects for select
  using (
    bucket_id = 'company-docs'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );

create policy "company-docs: upload próprio"
  on storage.objects for insert
  with check (
    bucket_id = 'company-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "company-docs: atualização própria ou admin"
  on storage.objects for update
  using (
    bucket_id = 'company-docs'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );

create policy "company-docs: exclusão própria ou admin"
  on storage.objects for delete
  using (
    bucket_id = 'company-docs'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );
