-- ============================================
-- WealthOS - Migration 012: Journal Balance Validation Trigger
-- ============================================
-- Applied: 2026-03-10 via Supabase MCP
-- Statement-level trigger que valida sum(debits) = sum(credits)
-- e mínimo 2 linhas por journal_entry após cada INSERT em journal_lines.
--
-- Usa REFERENCING NEW TABLE para acessar as linhas recém-inseridas
-- e validar todos os journal_entries afetados pelo statement.
--
-- Ref: Auditoria de segurança - Achado 5
-- ============================================

CREATE OR REPLACE FUNCTION validate_journal_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT DISTINCT nl.journal_entry_id
    FROM new_lines nl
    WHERE EXISTS (SELECT 1 FROM journal_entries WHERE id = nl.journal_entry_id)
  LOOP
    DECLARE
      v_total_debit   NUMERIC(14,2);
      v_total_credit  NUMERIC(14,2);
      v_line_count    INTEGER;
    BEGIN
      SELECT
        COALESCE(SUM(amount_debit), 0),
        COALESCE(SUM(amount_credit), 0),
        COUNT(*)
      INTO v_total_debit, v_total_credit, v_line_count
      FROM journal_lines
      WHERE journal_entry_id = v_rec.journal_entry_id;

      IF v_line_count < 2 THEN
        RAISE EXCEPTION 'Lançamento contábil deve ter pelo menos 2 linhas (débito + crédito). Encontradas: %', v_line_count;
      END IF;

      IF v_total_debit <> v_total_credit THEN
        RAISE EXCEPTION 'Lançamento desbalanceado: total débitos (%) <> total créditos (%). Diferença: %',
          v_total_debit, v_total_credit, ABS(v_total_debit - v_total_credit);
      END IF;
    END;
  END LOOP;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_journal_balance
  AFTER INSERT ON journal_lines
  REFERENCING NEW TABLE AS new_lines
  FOR EACH STATEMENT
  EXECUTE FUNCTION validate_journal_balance();
