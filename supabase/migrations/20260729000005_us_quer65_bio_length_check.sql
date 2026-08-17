-- =============================================================================
-- Migration: US QUER-65 — Biografia do prestador/freelancer
-- Descrição: Limite de tamanho da bio validado também no banco (não só no
--            client), consistente com o limite de 500 caracteres da UI.
-- =============================================================================

alter table freelancers
  drop constraint if exists freelancers_bio_length_check;

alter table freelancers
  add constraint freelancers_bio_length_check check (char_length(bio) <= 500);
