-- Drop da policy quebrada (causava loop: companies→jobs→companies)
DROP POLICY IF EXISTS "companies: leitura por freelancer participante" ON companies;

-- Função SECURITY DEFINER quebra o ciclo: roda com permissões do postgres,
-- bypassando RLS nas tabelas internas (mesmo padrão do is_admin())
CREATE OR REPLACE FUNCTION public.freelancer_has_application_for_company(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM jobs j
    JOIN applications a ON a.job_id = j.id
    JOIN freelancers f  ON f.id = a.freelancer_id
    WHERE j.company_id = p_company_id
      AND f.profile_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION freelancer_has_application_for_company(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION freelancer_has_application_for_company(uuid) FROM public;
GRANT  EXECUTE ON FUNCTION freelancer_has_application_for_company(uuid) TO authenticated;

-- Recria a policy usando a função segura
CREATE POLICY "companies: leitura por freelancer participante"
  ON companies FOR SELECT
  USING (
    freelancer_has_application_for_company(companies.id)
  );
