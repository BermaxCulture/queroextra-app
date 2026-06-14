-- -----------------------------------------------------------------------------
-- Valida Pay Integration - Adição de colunas
-- -----------------------------------------------------------------------------

-- Perfis
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rua text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS complemento text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS estado text;

-- Freelancers
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS faixa_renda text;
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS ocupacao text;
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS faixa_patrimonio text;
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS validapay_form_id text;
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS validapay_account_number text;
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS validapay_onboarding_status text CHECK (validapay_onboarding_status IN ('em_analise', 'aprovado', 'rejeitado'));

-- Transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS application_id uuid REFERENCES applications ON DELETE RESTRICT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS gateway_charge_id text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS emv text;

-- Atualizar enum constraint para transactions status caso a gente queira 'pendente' 
-- O PostgreSQL não permite dar ALTER TYPE numa check constraint facilmente sem recriar,
-- Mas a constraint está definida inline no "create table transactions":
-- check (status in ('retido', 'liberado', 'estornado'))
-- Vamos recriar a constraint para incluir 'pendente'
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_status_check CHECK (status IN ('pendente', 'retido', 'liberado', 'estornado'));
