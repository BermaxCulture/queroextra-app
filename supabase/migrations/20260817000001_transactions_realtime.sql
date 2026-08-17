-- =============================================================================
-- Migration: Habilita Realtime na tabela transactions
-- Descrição: CandidatosTab.tsx passa a detectar a confirmação de pagamento
--            PIX via Postgres Changes (UPDATE em transactions.status) em vez
--            de só polling — o webhook da Valida Pay grava status 'retido' e
--            o frontend é avisado na hora, sem precisar ficar consultando a
--            API da Valida Pay a cada poucos segundos. RLS de transactions já
--            restringe a leitura a admin/empresa dona/freelancer dono, então
--            o Realtime respeita o mesmo isolamento.
-- =============================================================================

alter publication supabase_realtime add table transactions;
