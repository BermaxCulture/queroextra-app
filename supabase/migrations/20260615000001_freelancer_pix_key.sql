-- Adiciona chave PIX do freelancer para repasse pós-checkout
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS pix_key text;
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS pix_key_type text CHECK (pix_key_type IN ('cpf', 'telefone', 'email', 'chave_aleatoria'));
