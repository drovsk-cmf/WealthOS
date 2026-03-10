-- ============================================
-- WealthOS - Migration 015: Fix import_transactions_batch
-- ============================================
-- S6: Allow NULL bank_connection_id (eliminate sentinel UUID)
-- S4: Remove redundant ABS() - parsers now always send positive amounts
-- ============================================

CREATE OR REPLACE FUNCTION import_transactions_batch(
  p_user_id UUID,
  p_account_id UUID,
  p_bank_connection_id UUID DEFAULT NULL,
  p_batch_id UUID DEFAULT NULL,
  p_transactions JSONB DEFAULT '[]'::JSONB
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
  v_cat_id UUID;
  v_tx_type transaction_type;
  v_amount NUMERIC;
  v_ext_id TEXT;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  FOR v_tx IN SELECT * FROM jsonb_array_elements(p_transactions)
  LOOP
    v_ext_id := v_tx->>'external_id';
    -- Amount now comes pre-normalized (always positive) from parsers
    v_amount := ABS((v_tx->>'amount')::NUMERIC);

    -- Skip duplicates by external_id
    IF v_ext_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM transactions
      WHERE user_id = p_user_id AND external_id = v_ext_id AND is_deleted = false
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Determine type from explicit field or sign
    IF v_tx->>'type' IS NOT NULL AND v_tx->>'type' != '' THEN
      v_tx_type := (v_tx->>'type')::transaction_type;
    ELSIF (v_tx->>'amount')::NUMERIC >= 0 THEN
      v_tx_type := 'income';
    ELSE
      v_tx_type := 'expense';
    END IF;

    -- Auto-categorize
    v_cat_id := auto_categorize_transaction(p_user_id, COALESCE(v_tx->>'description', ''));
    IF v_cat_id IS NOT NULL THEN
      v_categorized := v_categorized + 1;
    END IF;

    -- Insert transaction
    INSERT INTO transactions (
      user_id, account_id, category_id, type, amount, description,
      date, is_paid, source, bank_connection_id, external_id, import_batch_id
    ) VALUES (
      p_user_id,
      p_account_id,
      v_cat_id,
      v_tx_type,
      v_amount,
      v_tx->>'description',
      (v_tx->>'date')::DATE,
      true,
      CASE WHEN p_bank_connection_id IS NOT NULL THEN 'bank_feed'::entry_source ELSE 'csv_import'::entry_source END,
      p_bank_connection_id,  -- NULL is valid (no FK violation)
      v_ext_id,
      COALESCE(p_batch_id, gen_random_uuid())
    );

    v_imported := v_imported + 1;
  END LOOP;

  -- Update bank_connection last_sync (only if connection exists)
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
    'batch_id', COALESCE(p_batch_id, gen_random_uuid())
  );
END;
$$;

GRANT EXECUTE ON FUNCTION import_transactions_batch(UUID, UUID, UUID, UUID, JSONB) TO authenticated;
