-- =============================================================================
-- Migration: 20260519000001_add_bio_to_freelancers
-- Descrição: Adiciona a coluna bio à tabela freelancers para descrição profissional.
-- =============================================================================

ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS bio text;

comment on column freelancers.bio is 'Biografia/descrição profissional do freelancer.';
