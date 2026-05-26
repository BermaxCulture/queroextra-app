-- Adiciona coluna status (pendente = criada mas não enviada, enviada = completa, expirada = prazo vencido)
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'enviada'
    CHECK (status IN ('pendente', 'enviada', 'expirada'));

-- Torna nota nullable para registros pendentes
ALTER TABLE reviews ALTER COLUMN nota DROP NOT NULL;

-- Constraint: nota obrigatória quando status = 'enviada'
ALTER TABLE reviews
  ADD CONSTRAINT reviews_nota_when_enviada
    CHECK (status <> 'enviada' OR (nota IS NOT NULL AND nota BETWEEN 1 AND 5));

-- Política UPDATE: avaliador pode atualizar suas próprias avaliações pendentes
CREATE POLICY "reviews: atualização pelo avaliador"
  ON reviews FOR UPDATE
  TO authenticated
  USING  (avaliador_id = auth.uid())
  WITH CHECK (avaliador_id = auth.uid());
