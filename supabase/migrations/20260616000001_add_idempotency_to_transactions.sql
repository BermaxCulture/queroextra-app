-- Migration: adiciona idempotency_key e gateway_payment_id à tabela transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS gateway_payment_id text;
