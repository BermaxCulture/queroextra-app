-- ============================================================
-- Script: Apagar usuários completos do banco de dados
-- Instrução: substitua os e-mails abaixo e cole no SQL Editor
-- URL: https://supabase.com/dashboard/project/bgkbruloojndolgtring/sql
-- ============================================================

DO $$
DECLARE
  target_emails text[] := ARRAY[
    -- ✏️ Coloque aqui os e-mails que deseja apagar:
    'yslan.contato@gmail.com',
    'yslanl2005@gmail.com',
    'yslan23300302@aluno.cesupa.br'
    -- adicione quantos quiser, separados por vírgula
  ];
  uid uuid;
BEGIN
  FOREACH uid IN ARRAY (
    SELECT ARRAY(SELECT id FROM auth.users WHERE email = ANY(target_emails))
  )
  LOOP
    -- 1. Tabelas filhas de jobs (que dependem de applications)
    DELETE FROM transactions WHERE job_id IN (SELECT id FROM jobs WHERE company_id IN (SELECT id FROM companies WHERE profile_id = uid));
    DELETE FROM checkins     WHERE application_id IN (SELECT id FROM applications WHERE freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = uid));
    DELETE FROM reviews      WHERE avaliador_id = uid OR avaliado_id = uid;
    DELETE FROM notifications WHERE user_id = uid;

    -- 2. Applications
    DELETE FROM applications
      WHERE freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = uid)
         OR job_id IN (SELECT id FROM jobs WHERE company_id IN (SELECT id FROM companies WHERE profile_id = uid));

    -- 3. Transactions restantes ligadas a jobs da empresa
    DELETE FROM transactions WHERE job_id IN (SELECT id FROM jobs WHERE company_id IN (SELECT id FROM companies WHERE profile_id = uid));

    -- 4. Jobs
    DELETE FROM jobs WHERE company_id IN (SELECT id FROM companies WHERE profile_id = uid);

    -- 5. Wallet
    DELETE FROM wallets WHERE freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = uid);

    -- 6. Freelancer / Company
    DELETE FROM freelancers WHERE profile_id = uid;
    DELETE FROM companies   WHERE profile_id = uid;

    -- 7. Profile
    DELETE FROM profiles WHERE id = uid;

    -- 8. Auth (Supabase auth — deve ser o último)
    DELETE FROM auth.identities     WHERE user_id = uid;
    DELETE FROM auth.sessions       WHERE user_id = uid;
    DELETE FROM auth.refresh_tokens WHERE user_id = uid::text;  -- varchar no schema auth
    DELETE FROM auth.mfa_factors    WHERE user_id = uid;
    DELETE FROM auth.users          WHERE id = uid;

    RAISE NOTICE 'Usuário % apagado com sucesso', uid;
  END LOOP;
END $$;
