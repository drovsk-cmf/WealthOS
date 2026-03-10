-- ============================================
-- WealthOS - Migration 011: Dedup UNIQUE index para external_id
-- ============================================
-- Applied: 2026-03-10 via Supabase MCP
-- O index existente (idx_transactions_external_id) era btree simples.
-- Substituído por UNIQUE parcial incluindo account_id e excluindo deletados.
-- Garante rejeição automática de transações duplicadas no import OFX/CSV.
--
-- Ref: Auditoria de segurança - Achado 4
-- ============================================

-- Remover index antigo (btree simples, não impedia duplicatas)
DROP INDEX IF EXISTS idx_transactions_external_id;

-- UNIQUE parcial: por usuário + conta + external_id, excluindo deletados
CREATE UNIQUE INDEX idx_tx_external_id_dedup
  ON transactions (user_id, account_id, external_id)
  WHERE external_id IS NOT NULL AND is_deleted = FALSE;

-- Index auxiliar para lookup rápido
CREATE INDEX idx_tx_external_id_lookup
  ON transactions (external_id)
  WHERE external_id IS NOT NULL;

COMMENT ON COLUMN transactions.external_id IS
  'Hash SHA-256 do identificador externo (FITID p/ OFX, composto p/ CSV). NULL para transações manuais. UNIQUE por (user_id, account_id) para deduplicação cross-import.';
