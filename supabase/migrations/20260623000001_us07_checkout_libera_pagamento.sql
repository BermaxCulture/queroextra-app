-- US-07: Checkout confirmado libera saldo para saque do freelancer

-- Coluna para registrar quando o pagamento foi liberado
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS liberado_em timestamptz;

-- Função do trigger
CREATE OR REPLACE FUNCTION fn_liberar_pagamento_no_checkout()
RETURNS trigger AS $$
BEGIN
  -- Só dispara em checkouts confirmados pela primeira vez
  IF NEW.tipo = 'checkout'
    AND NEW.confirmado_em IS NOT NULL
    AND OLD.confirmado_em IS NULL
  THEN
    UPDATE transactions
    SET status = 'liberado',
        liberado_em = now()
    WHERE application_id = NEW.application_id
      AND status = 'retido';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove trigger anterior se existir
DROP TRIGGER IF EXISTS trg_liberar_pagamento_no_checkout ON checkins;

-- Cria o trigger
CREATE TRIGGER trg_liberar_pagamento_no_checkout
  AFTER UPDATE ON checkins
  FOR EACH ROW
  EXECUTE FUNCTION fn_liberar_pagamento_no_checkout();
