-- V-06: RLS na tabela transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Freelancer vê suas próprias transações (via application_id → freelancer_id)
CREATE POLICY "transactions: freelancer lê as suas"
  ON transactions FOR SELECT
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN freelancers f ON f.id = a.freelancer_id
      WHERE f.profile_id = auth.uid()
    )
  );

-- Empresa vê transações das suas vagas
CREATE POLICY "transactions: empresa lê as suas"
  ON transactions FOR SELECT
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN companies c ON c.id = j.company_id
      WHERE c.profile_id = auth.uid()
    )
  );

-- V-07: RLS de INSERT em applications exige subconta aprovada (server-side)
-- Atualiza a policy existente de INSERT para incluir validação de onboarding
DROP POLICY IF EXISTS "applications: inserção pelo freelancer" ON applications;

CREATE POLICY "applications: inserção pelo freelancer"
  ON applications FOR INSERT
  WITH CHECK (
    freelancer_id IN (
      SELECT id FROM freelancers
      WHERE profile_id = auth.uid()
        AND validapay_onboarding_status = 'aprovado'
    )
  );
