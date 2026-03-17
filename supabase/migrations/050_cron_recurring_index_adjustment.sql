-- P4: Add automatic index adjustment (IPCA/IGP-M/INPC/Selic) to cron_generate_recurring_transactions
-- Previously only applied manual adjustment; now mirrors the logic from generate_next_recurrence RPC.
CREATE OR REPLACE FUNCTION cron_generate_recurring_transactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
  v_template JSONB;
  v_amount NUMERIC;
  v_next_date DATE;
  v_tx_result JSON;
  v_tx_id UUID;
  v_generated INT := 0;
  v_deactivated INT := 0;
  v_skipped INT := 0;
  v_rate NUMERIC;
  v_index_value NUMERIC;
  v_index_12m NUMERIC;
BEGIN
  FOR v_rec IN
    SELECT r.*, r.template_transaction AS tpl
    FROM recurrences r
    WHERE r.is_active = true
      AND r.next_due_date <= CURRENT_DATE
    ORDER BY r.next_due_date ASC
  LOOP
    -- Duplicate guard: skip if transaction already exists for this recurrence on this date
    IF EXISTS (
      SELECT 1 FROM transactions
      WHERE recurrence_id = v_rec.id
        AND date = v_rec.next_due_date
        AND is_deleted = false
    ) THEN
      -- Advance next_due_date so we don't get stuck
      v_next_date := CASE v_rec.frequency
        WHEN 'daily' THEN v_rec.next_due_date + (v_rec.interval_count || ' days')::INTERVAL
        WHEN 'weekly' THEN v_rec.next_due_date + (v_rec.interval_count * 7 || ' days')::INTERVAL
        WHEN 'monthly' THEN v_rec.next_due_date + (v_rec.interval_count || ' months')::INTERVAL
        WHEN 'yearly' THEN v_rec.next_due_date + (v_rec.interval_count || ' years')::INTERVAL
      END;

      UPDATE recurrences SET next_due_date = v_next_date, updated_at = now()
      WHERE id = v_rec.id;

      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    v_template := v_rec.tpl;

    -- Calculate next due date
    v_next_date := CASE v_rec.frequency
      WHEN 'daily' THEN v_rec.next_due_date + (v_rec.interval_count || ' days')::INTERVAL
      WHEN 'weekly' THEN v_rec.next_due_date + (v_rec.interval_count * 7 || ' days')::INTERVAL
      WHEN 'monthly' THEN v_rec.next_due_date + (v_rec.interval_count || ' months')::INTERVAL
      WHEN 'yearly' THEN v_rec.next_due_date + (v_rec.interval_count || ' years')::INTERVAL
    END;

    -- Check end_date: deactivate if next occurrence would exceed it
    IF v_rec.end_date IS NOT NULL AND v_rec.next_due_date > v_rec.end_date THEN
      UPDATE recurrences SET is_active = false, updated_at = now()
      WHERE id = v_rec.id;
      v_deactivated := v_deactivated + 1;
      CONTINUE;
    END IF;

    -- Apply adjustment (manual OR automatic index)
    v_amount := (v_template->>'amount')::NUMERIC;

    IF v_rec.adjustment_index IS NOT NULL AND v_rec.adjustment_index != 'none' THEN
      IF v_rec.adjustment_index = 'manual' AND v_rec.adjustment_rate IS NOT NULL THEN
        -- Manual: fixed percentage per interval
        v_amount := ROUND(v_amount * (1 + v_rec.adjustment_rate / 100.0), 2);
      ELSIF v_rec.adjustment_index IN ('ipca', 'igpm', 'inpc', 'selic') THEN
        -- Automatic index adjustment: lookup latest value from economic_indices
        SELECT ei.value, ei.accumulated_12m
        INTO v_index_value, v_index_12m
        FROM economic_indices ei
        WHERE ei.index_type = v_rec.adjustment_index::economic_index_type
        ORDER BY ei.reference_date DESC
        LIMIT 1;

        IF v_index_value IS NOT NULL THEN
          v_rate := CASE v_rec.frequency
            WHEN 'monthly' THEN v_index_value
            WHEN 'yearly' THEN COALESCE(v_index_12m, v_index_value * 12)
            WHEN 'weekly' THEN v_index_value / 4.0
            WHEN 'daily' THEN v_index_value / 30.0
          END;

          IF v_rate IS NOT NULL AND v_rate != 0 THEN
            v_amount := ROUND(v_amount * (1 + v_rate / 100.0), 2);
          END IF;
        END IF;
        -- If no index data found, keep original amount (no silent failure)
      END IF;
    END IF;

    v_template := jsonb_set(v_template, '{amount}', to_jsonb(v_amount));

    -- Create pending transaction via existing RPC (no auth.uid() check needed in cron context)
    BEGIN
      v_tx_result := create_transaction_with_journal(
        p_user_id := v_rec.user_id,
        p_account_id := (v_template->>'account_id')::UUID,
        p_category_id := (v_template->>'category_id')::UUID,
        p_type := (v_template->>'type')::transaction_type,
        p_amount := v_amount,
        p_description := v_template->>'description',
        p_date := v_rec.next_due_date,
        p_is_paid := false,
        p_source := 'system'::entry_source
      );

      v_tx_id := (v_tx_result->>'transaction_id')::UUID;

      -- Link transaction to recurrence + set due_date
      UPDATE transactions
      SET recurrence_id = v_rec.id,
          due_date = v_rec.next_due_date
      WHERE id = v_tx_id;

      -- Advance next_due_date
      UPDATE recurrences
      SET next_due_date = v_next_date,
          updated_at = now()
      WHERE id = v_rec.id;

      v_generated := v_generated + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't stop processing other recurrences
      RAISE WARNING '[Oniefy cron] Failed to generate recurrence % for user %: %',
        v_rec.id, v_rec.user_id, SQLERRM;
    END;
  END LOOP;

  RAISE LOG '[Oniefy cron] recurring transactions: generated=%, deactivated=%, skipped=%',
    v_generated, v_deactivated, v_skipped;
END;
$$;
