-- =============================================================================
-- Migration: US QUER-66 — Foto de perfil do prestador
-- Descrição: Ajusta o bucket avatars para o limite/tipos pedidos pela ticket
--            (jpg/png/webp, até 5MB). Enforcement server-side é feito pelo
--            próprio bucket (allowed_mime_types/file_size_limit), não confia
--            apenas na validação client-side.
-- =============================================================================

update storage.buckets
set
  file_size_limit = 5242880, -- 5MB
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
where id = 'avatars';
