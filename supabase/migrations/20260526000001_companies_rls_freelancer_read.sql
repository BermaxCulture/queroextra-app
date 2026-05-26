-- Permite que freelancers com candidatura na vaga leiam dados da empresa
-- Necessário para o FreelancerCheckinPage resolver company_profile_id via join
CREATE POLICY "companies: leitura por freelancer participante"
  ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM jobs j
      JOIN applications a ON a.job_id = j.id
      JOIN freelancers f  ON f.id = a.freelancer_id
      WHERE j.company_id = companies.id
        AND f.profile_id = auth.uid()
    )
  );
