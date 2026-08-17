-- =============================================================================
-- Migration: Disputas de pagamento em transactions
-- Descrição: dá suporte ao fluxo usuário → QueroExtra de disputa de pagamento
--            (ex: freelancer sumiu no turno e a empresa quer reembolso; ou a
--            empresa não confirma o checkout e o freelancer fica com o
--            dinheiro preso em 'retido'). Empresa e freelancer podem abrir
--            uma disputa na própria transação (via edge function
--            open-dispute); o admin resolve manualmente pelo painel
--            (queroextra-admin, /financas → Disputas), decidindo entre
--            estornar a empresa ou liberar o freelancer. A automação para
--            entre "usuário avisa QueroExtra" — a disputa de verdade junto à
--            ValidaPay é feita manualmente pelo time.
-- =============================================================================

alter table transactions
  add column if not exists em_disputa boolean not null default false,
  add column if not exists motivo_disputa text,
  add column if not exists disputa_aberta_por uuid references profiles(id),
  add column if not exists disputa_aberta_em timestamptz,
  add column if not exists decisao_admin text,
  add column if not exists disputa_resolvida_em timestamptz,
  add column if not exists resolvido_por uuid references profiles(id);

comment on column transactions.em_disputa is
  'true enquanto a disputa está aberta e aguardando o admin decidir; volta a false quando resolvida (estornado ou liberado)';
comment on column transactions.disputa_aberta_por is
  'profile_id de quem abriu a disputa — a empresa (via companies.profile_id) ou o freelancer (via freelancers.profile_id) dono da transação';
