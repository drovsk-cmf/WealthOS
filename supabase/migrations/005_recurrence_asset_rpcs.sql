-- ============================================
-- WealthOS - Migration 005: Recurrence & Asset RPCs
-- ============================================
-- Phase 4: CAP-01 to CAP-06, PAT-01 to PAT-07
-- ============================================

-- ─── 1. generate_next_recurrence ──────────────────────────────
-- CAP-05: When user marks a pending transaction as paid,
-- auto-advance next_due_date and create the next pending transaction.
-- Called from frontend after payment confirmation.

CREATE OR REPLACE FUNCTION generate_next_recurrence(
  p_user_id UUID,
  p_recurrence_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
  v_next_date DATE;
  v_template JSONB;
  v_tx_id UUID;
  v_je_id UUID;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Fetch recurrence
  SELECT * INTO v_rec
  FROM recurrences
  WHERE id = p_recurrence_id AND user_id = p_user_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recorrência não encontrada ou inativa';
  END IF;

  v_template := v_rec.template_transaction;

  -- Calculate next due date based on frequency
  v_next_date := CASE v_rec.frequency
    WHEN 'daily' THEN v_rec.next_due_date + (v_rec.interval_count || ' days')::INTERVAL
    WHEN 'weekly' THEN v_rec.next_due_date + (v_rec.interval_count * 7 || ' days')::INTERVAL
    WHEN 'monthly' THEN v_rec.next_due_date + (v_rec.interval_count || ' months')::INTERVAL
    WHEN 'yearly' THEN v_rec.next_due_date + (v_rec.interval_count || ' years')::INTERVAL
  END;

  -- Check if recurrence has ended
  IF v_rec.end_date IS NOT NULL AND v_next_date > v_rec.end_date THEN
    -- Deactivate recurrence
    UPDATE recurrences SET is_active = false, updated_at = now()
    WHERE id = p_recurrence_id;

    RETURN json_build_object(
      'status', 'ended',
      'recurrence_id', p_recurrence_id,
      'message', 'Recorrência encerrada (data final atingida)'
    );
  END IF;

  -- Apply adjustment if configured
  DECLARE
    v_amount NUMERIC;
  BEGIN
    v_amount := (v_template->>'amount')::NUMERIC;

    IF v_rec.adjustment_index IS NOT NULL AND v_rec.adjustment_index != 'none' THEN
      IF v_rec.adjustment_index = 'manual' AND v_rec.adjustment_rate IS NOT NULL THEN
        v_amount := ROUND(v_amount * (1 + v_rec.adjustment_rate / 100.0), 2);
      END IF;
      -- Note: automatic index adjustment (IPCA, etc.) will be handled by
      -- the fetch-economic-indices Edge Function in Phase 8.
      -- For now, only manual adjustment is applied.
    END IF;

    -- Update template with adjusted amount
    v_template := jsonb_set(v_template, '{amount}', to_jsonb(v_amount));
  END;

  -- Create next pending transaction via the existing RPC
  SELECT (result->>'transaction_id')::UUID, (result->>'journal_entry_id')::UUID
  INTO v_tx_id, v_je_id
  FROM create_transaction_with_journal(
    p_user_id := p_user_id,
    p_account_id := (v_template->>'account_id')::UUID,
    p_category_id := (v_template->>'category_id')::UUID,
    p_type := (v_template->>'type')::transaction_type,
    p_amount := (v_template->>'amount')::NUMERIC,
    p_description := v_template->>'description',
    p_date := v_next_date::TEXT,
    p_is_paid := false,
    p_source := 'system'::entry_source,
    p_notes := NULL,
    p_tags := NULL,
    p_counterpart_coa_id := NULL
  ) AS result;

  -- Link transaction to recurrence
  UPDATE transactions SET recurrence_id = p_recurrence_id WHERE id = v_tx_id;

  -- Advance next_due_date
  UPDATE recurrences
  SET next_due_date = v_next_date, updated_at = now()
  WHERE id = p_recurrence_id;

  RETURN json_build_object(
    'status', 'generated',
    'recurrence_id', p_recurrence_id,
    'transaction_id', v_tx_id,
    'journal_entry_id', v_je_id,
    'next_due_date', v_next_date,
    'amount', (v_template->>'amount')::NUMERIC
  );
END;
$$;

GRANT EXECUTE ON FUNCTION generate_next_recurrence(UUID, UUID) TO authenticated;


-- ─── 2. depreciate_asset ──────────────────────────────────────
-- PAT-05: Apply depreciation to an asset.
-- Records in asset_value_history and updates current_value.
-- Depreciation = current_value * (rate / 12 / 100) [monthly linear]

CREATE OR REPLACE FUNCTION depreciate_asset(
  p_user_id UUID,
  p_asset_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_asset RECORD;
  v_depreciation NUMERIC;
  v_new_value NUMERIC;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_asset
  FROM assets
  WHERE id = p_asset_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bem não encontrado';
  END IF;

  IF v_asset.depreciation_rate <= 0 THEN
    RETURN json_build_object(
      'status', 'skipped',
      'reason', 'Taxa de depreciação é zero'
    );
  END IF;

  -- Monthly linear depreciation
  v_depreciation := ROUND(v_asset.current_value * (v_asset.depreciation_rate / 12.0 / 100.0), 2);

  -- Floor at zero
  v_new_value := GREATEST(v_asset.current_value - v_depreciation, 0);

  -- Record history
  INSERT INTO asset_value_history (asset_id, user_id, previous_value, new_value, change_reason, change_source)
  VALUES (p_asset_id, p_user_id, v_asset.current_value, v_new_value, 'Depreciação mensal automática', 'depreciation');

  -- Update asset
  UPDATE assets
  SET current_value = v_new_value, updated_at = now()
  WHERE id = p_asset_id;

  RETURN json_build_object(
    'status', 'depreciated',
    'asset_id', p_asset_id,
    'previous_value', v_asset.current_value,
    'depreciation', v_depreciation,
    'new_value', v_new_value,
    'rate_annual', v_asset.depreciation_rate
  );
END;
$$;

GRANT EXECUTE ON FUNCTION depreciate_asset(UUID, UUID) TO authenticated;


-- ─── 3. get_assets_summary ────────────────────────────────────
-- PAT-04 + PAT-06: Summary for assets page header
-- Returns totals by category + insurance alerts

CREATE OR REPLACE FUNCTION get_assets_summary(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN json_build_object(
    'total_value', COALESCE((
      SELECT SUM(current_value) FROM assets WHERE user_id = p_user_id
    ), 0),
    'total_acquisition', COALESCE((
      SELECT SUM(acquisition_value) FROM assets WHERE user_id = p_user_id
    ), 0),
    'asset_count', COALESCE((
      SELECT COUNT(*)::INT FROM assets WHERE user_id = p_user_id
    ), 0),
    'by_category', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT category, COUNT(*)::INT AS count, SUM(current_value) AS total_value
        FROM assets WHERE user_id = p_user_id
        GROUP BY category ORDER BY SUM(current_value) DESC
      ) t
    ), '[]'::JSON),
    'expiring_insurance', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, name, insurance_expiry,
          (insurance_expiry - CURRENT_DATE) AS days_until_expiry
        FROM assets
        WHERE user_id = p_user_id
          AND insurance_expiry IS NOT NULL
          AND insurance_expiry <= CURRENT_DATE + INTERVAL '30 days'
        ORDER BY insurance_expiry
      ) t
    ), '[]'::JSON),
    'total_depreciation', COALESCE((
      SELECT SUM(acquisition_value - current_value) FROM assets WHERE user_id = p_user_id
    ), 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_assets_summary(UUID) TO authenticated;
