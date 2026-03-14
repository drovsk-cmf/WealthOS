-- ============================================================
-- Migration 028: Bank Reconciliation
-- Camada 1: Status lifecycle + due_date + pg_cron overdue
-- Camada 2: Auto-matching RPC + manual match RPC
-- Camada 3: find_reconciliation_candidates for UI
-- ============================================================

-- ─── 1. ENUM payment_status ──────────────────────────────────

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'overdue', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. ALTER transactions ───────────────────────────────────

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS payment_status payment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS matched_transaction_id UUID REFERENCES transactions(id),
  ADD COLUMN IF NOT EXISTS amount_adjustment NUMERIC NOT NULL DEFAULT 0;

COMMENT ON COLUMN transactions.payment_status IS 'Lifecycle: pending → overdue (by cron) → paid → cancelled';
COMMENT ON COLUMN transactions.due_date IS 'Data de vencimento (distinta de date=data do lançamento)';
COMMENT ON COLUMN transactions.matched_transaction_id IS 'Transação par na conciliação (pendente ↔ importada)';
COMMENT ON COLUMN transactions.amount_adjustment IS 'Diferença registrada quando conciliação tem valor divergente';

-- Index for pending/overdue queries
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status
  ON transactions(user_id, payment_status) WHERE payment_status IN ('pending', 'overdue');

-- Index for matching candidates
CREATE INDEX IF NOT EXISTS idx_transactions_reconciliation
  ON transactions(user_id, account_id, payment_status, date)
  WHERE is_deleted = false;

-- ─── 3. Backfill payment_status from is_paid ─────────────────

UPDATE transactions
SET payment_status = CASE
  WHEN is_paid = true THEN 'paid'::payment_status
  ELSE 'pending'::payment_status
END
WHERE payment_status = 'pending' AND is_paid = true;

-- For pending bills with past due_date, mark overdue
-- (due_date doesn't exist yet for old data, but will be set by recurrence engine)

-- ─── 4. Trigger: sync is_paid ↔ payment_status ──────────────
-- Keeps backward compatibility: code writing is_paid still works,
-- code writing payment_status updates is_paid automatically.

CREATE OR REPLACE FUNCTION sync_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- If payment_status changed, sync is_paid
  IF TG_OP = 'UPDATE' AND OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    NEW.is_paid := (NEW.payment_status = 'paid');
  -- If is_paid changed (legacy code), sync payment_status
  ELSIF TG_OP = 'UPDATE' AND OLD.is_paid IS DISTINCT FROM NEW.is_paid THEN
    IF NEW.is_paid = true AND NEW.payment_status IN ('pending', 'overdue') THEN
      NEW.payment_status := 'paid';
    ELSIF NEW.is_paid = false AND NEW.payment_status = 'paid' THEN
      NEW.payment_status := 'pending';
    END IF;
  -- On INSERT, sync based on is_paid
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.is_paid = true AND NEW.payment_status = 'pending' THEN
      NEW.payment_status := 'paid';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_payment_status_trigger ON transactions;
CREATE TRIGGER sync_payment_status_trigger
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION sync_payment_status();

-- ─── 5. pg_cron: mark overdue transactions ───────────────────
-- Runs daily at 01:00 UTC. Marks pending transactions with due_date < today.

CREATE OR REPLACE FUNCTION cron_mark_overdue_transactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE transactions
  SET payment_status = 'overdue'
  WHERE payment_status = 'pending'
    AND due_date IS NOT NULL
    AND due_date < CURRENT_DATE
    AND is_deleted = false;
END;
$$;

-- Schedule: daily at 01:00 UTC (22:00 BRT)
SELECT cron.schedule(
  'mark-overdue-transactions',
  '0 1 * * *',
  $$SELECT cron_mark_overdue_transactions()$$
);

-- ─── 6. RPC: find_reconciliation_candidates ──────────────────
-- For a given imported transaction, finds potential matches among
-- pending/overdue transactions in the same account.
-- Criteria: same account, amount within ±10%, date within ±7 days.

CREATE OR REPLACE FUNCTION find_reconciliation_candidates(
  p_user_id UUID,
  p_account_id UUID,
  p_amount NUMERIC,
  p_date DATE,
  p_tolerance_pct NUMERIC DEFAULT 10,
  p_tolerance_days INT DEFAULT 7
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_min_amount NUMERIC;
  v_max_amount NUMERIC;
  v_min_date DATE;
  v_max_date DATE;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  v_min_amount := p_amount * (1 - p_tolerance_pct / 100);
  v_max_amount := p_amount * (1 + p_tolerance_pct / 100);
  v_min_date := p_date - p_tolerance_days;
  v_max_date := p_date + p_tolerance_days;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json)
    FROM (
      SELECT
        t.id,
        t.description,
        t.amount,
        t.date,
        t.due_date,
        t.type,
        t.payment_status,
        t.category_id,
        t.recurrence_id,
        ABS(t.amount - p_amount) AS amount_diff,
        ABS(t.date - p_date) AS days_diff,
        -- Confidence score: lower is better
        (ABS(t.amount - p_amount) / GREATEST(p_amount, 0.01) * 50
         + ABS(t.date - p_date) * 5) AS match_score
      FROM transactions t
      WHERE t.user_id = p_user_id
        AND t.account_id = p_account_id
        AND t.payment_status IN ('pending', 'overdue')
        AND t.is_deleted = false
        AND t.matched_transaction_id IS NULL
        AND t.amount BETWEEN v_min_amount AND v_max_amount
        AND t.date BETWEEN v_min_date AND v_max_date
      ORDER BY match_score ASC
      LIMIT 5
    ) c
  );
END;
$$;

GRANT EXECUTE ON FUNCTION find_reconciliation_candidates(UUID, UUID, NUMERIC, DATE, NUMERIC, INT) TO authenticated;

-- ─── 7. RPC: match_transactions ──────────────────────────────
-- Manually (or auto) link a pending transaction to an imported one.
-- The pending gets marked as paid, adjustment recorded if amounts differ.

CREATE OR REPLACE FUNCTION match_transactions(
  p_user_id UUID,
  p_pending_id UUID,
  p_imported_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending transactions%ROWTYPE;
  v_imported transactions%ROWTYPE;
  v_adjustment NUMERIC;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Load both transactions
  SELECT * INTO v_pending FROM transactions
    WHERE id = p_pending_id AND user_id = p_user_id AND is_deleted = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transação pendente não encontrada';
  END IF;

  SELECT * INTO v_imported FROM transactions
    WHERE id = p_imported_id AND user_id = p_user_id AND is_deleted = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transação importada não encontrada';
  END IF;

  -- Validate: pending must be pending/overdue
  IF v_pending.payment_status NOT IN ('pending', 'overdue') THEN
    RAISE EXCEPTION 'Transação já conciliada ou cancelada';
  END IF;

  -- Validate: both must be in the same account
  IF v_pending.account_id != v_imported.account_id THEN
    RAISE EXCEPTION 'Transações devem pertencer à mesma conta';
  END IF;

  -- Calculate adjustment
  v_adjustment := v_imported.amount - v_pending.amount;

  -- Link them together
  UPDATE transactions
  SET payment_status = 'paid',
      matched_transaction_id = p_imported_id,
      amount_adjustment = v_adjustment
  WHERE id = p_pending_id;

  UPDATE transactions
  SET matched_transaction_id = p_pending_id
  WHERE id = p_imported_id;

  -- Soft-delete the imported duplicate (the pending one "absorbs" it)
  -- The pending transaction is now the canonical record, marked as paid.
  -- The imported one is kept for audit trail but marked deleted.
  UPDATE transactions
  SET is_deleted = true
  WHERE id = p_imported_id;

  RETURN json_build_object(
    'status', 'matched',
    'pending_id', p_pending_id,
    'imported_id', p_imported_id,
    'adjustment', v_adjustment,
    'final_amount', v_pending.amount + v_adjustment
  );
END;
$$;

GRANT EXECUTE ON FUNCTION match_transactions(UUID, UUID, UUID) TO authenticated;

-- ─── 8. Rewrite import_transactions_batch with auto-matching ─
-- Enhanced: before inserting, check for matching pending transactions.
-- If match found with score < threshold, auto-match instead of insert.

CREATE OR REPLACE FUNCTION import_transactions_batch(
  p_user_id UUID,
  p_account_id UUID,
  p_bank_connection_id UUID,
  p_batch_id UUID,
  p_transactions JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx JSONB;
  v_imported INT := 0;
  v_skipped INT := 0;
  v_categorized INT := 0;
  v_matched INT := 0;
  v_cat_id UUID;
  v_tx_type transaction_type;
  v_amount NUMERIC;
  v_ext_id TEXT;
  v_date DATE;
  v_match_id UUID;
  v_match_score NUMERIC;
  v_new_tx_id UUID;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  FOR v_tx IN SELECT * FROM jsonb_array_elements(p_transactions)
  LOOP
    v_ext_id := v_tx->>'external_id';
    v_amount := ABS((v_tx->>'amount')::NUMERIC);
    v_date := (v_tx->>'date')::DATE;

    -- Skip duplicates by external_id
    IF v_ext_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM transactions
      WHERE user_id = p_user_id AND external_id = v_ext_id AND is_deleted = false
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Determine type
    IF (v_tx->>'amount')::NUMERIC >= 0 THEN
      v_tx_type := 'income';
    ELSE
      v_tx_type := 'expense';
    END IF;

    IF v_tx->>'type' IS NOT NULL AND v_tx->>'type' != '' THEN
      v_tx_type := (v_tx->>'type')::transaction_type;
    END IF;

    -- ═══ AUTO-MATCHING (Camada 2) ═══
    -- Look for pending/overdue transaction that matches this import
    SELECT t.id, 
           (ABS(t.amount - v_amount) / GREATEST(v_amount, 0.01) * 50 + ABS(t.date - v_date) * 5) AS score
    INTO v_match_id, v_match_score
    FROM transactions t
    WHERE t.user_id = p_user_id
      AND t.account_id = p_account_id
      AND t.payment_status IN ('pending', 'overdue')
      AND t.is_deleted = false
      AND t.matched_transaction_id IS NULL
      AND t.amount BETWEEN v_amount * 0.9 AND v_amount * 1.1
      AND t.date BETWEEN v_date - 7 AND v_date + 7
    ORDER BY score ASC
    LIMIT 1;

    -- If strong match (score < 25 = ~5% amount diff + ~2 days), auto-match
    IF v_match_id IS NOT NULL AND v_match_score < 25 THEN
      UPDATE transactions
      SET payment_status = 'paid',
          matched_transaction_id = NULL,  -- no separate imported tx to reference
          amount_adjustment = v_amount - amount,
          external_id = COALESCE(v_ext_id, external_id),
          import_batch_id = p_batch_id
      WHERE id = v_match_id;

      v_matched := v_matched + 1;
      CONTINUE;
    END IF;

    -- ═══ NORMAL INSERT (no match found) ═══
    -- Auto-categorize
    v_cat_id := auto_categorize_transaction(p_user_id, COALESCE(v_tx->>'description', ''));
    IF v_cat_id IS NOT NULL THEN
      v_categorized := v_categorized + 1;
    END IF;

    INSERT INTO transactions (
      user_id, account_id, category_id, type, amount, description,
      date, is_paid, payment_status, source, bank_connection_id,
      external_id, import_batch_id
    ) VALUES (
      p_user_id,
      p_account_id,
      v_cat_id,
      v_tx_type,
      v_amount,
      v_tx->>'description',
      v_date,
      true,
      'paid',
      CASE WHEN p_bank_connection_id IS NOT NULL THEN 'bank_feed'::entry_source ELSE 'csv_import'::entry_source END,
      p_bank_connection_id,
      v_ext_id,
      p_batch_id
    );

    v_imported := v_imported + 1;
  END LOOP;

  -- Update bank_connection last_sync
  IF p_bank_connection_id IS NOT NULL THEN
    UPDATE bank_connections
    SET last_sync_at = now(), sync_status = 'active', updated_at = now()
    WHERE id = p_bank_connection_id;
  END IF;

  RETURN json_build_object(
    'status', 'ok',
    'imported', v_imported,
    'skipped', v_skipped,
    'categorized', v_categorized,
    'matched', v_matched,
    'batch_id', p_batch_id
  );
END;
$$;

-- Grant already exists from migration 010, but re-grant to be safe
GRANT EXECUTE ON FUNCTION import_transactions_batch(UUID, UUID, UUID, UUID, JSONB) TO authenticated;
