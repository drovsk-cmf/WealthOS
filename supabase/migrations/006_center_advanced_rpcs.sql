-- ============================================
-- WealthOS - Migration 006: Center Advanced RPCs
-- ============================================
-- Phase 5: CEN-03 (rateio), CEN-04 (P&L), CEN-05 (export data)
-- ============================================

-- ─── 1. allocate_to_centers ──────────────────────────────────

CREATE OR REPLACE FUNCTION allocate_to_centers(
  p_user_id UUID,
  p_transaction_id UUID,
  p_allocations JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_pct NUMERIC := 0;
  v_alloc JSONB;
  v_line RECORD;
  v_tx RECORD;
  v_results JSONB := '[]'::JSONB;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT t.*, t.journal_entry_id INTO v_tx
  FROM transactions t
  WHERE t.id = p_transaction_id AND t.user_id = p_user_id AND t.is_deleted = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transação não encontrada';
  END IF;

  IF v_tx.journal_entry_id IS NULL THEN
    RAISE EXCEPTION 'Transação sem lançamento contábil';
  END IF;

  SELECT COALESCE(SUM((elem->>'percentage')::NUMERIC), 0) INTO v_total_pct
  FROM jsonb_array_elements(p_allocations) AS elem;

  IF ABS(v_total_pct - 100) > 0.01 THEN
    RAISE EXCEPTION 'Percentuais devem somar 100 porcento (soma atual: %)', v_total_pct;
  END IF;

  FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_allocations)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM cost_centers
      WHERE id = (v_alloc->>'cost_center_id')::UUID
        AND user_id = p_user_id AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Centro de custo inválido: %', v_alloc->>'cost_center_id';
    END IF;
  END LOOP;

  FOR v_line IN
    SELECT jl.* FROM journal_lines jl
    JOIN chart_of_accounts coa ON coa.id = jl.account_id
    WHERE jl.journal_entry_id = v_tx.journal_entry_id
      AND coa.group_type IN ('expense', 'revenue')
    LIMIT 1
  LOOP
    DELETE FROM center_allocations WHERE journal_line_id = v_line.id;

    FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_allocations)
    LOOP
      INSERT INTO center_allocations (journal_line_id, cost_center_id, percentage, amount)
      VALUES (
        v_line.id,
        (v_alloc->>'cost_center_id')::UUID,
        (v_alloc->>'percentage')::NUMERIC,
        ROUND(
          GREATEST(v_line.amount_debit, v_line.amount_credit) * (v_alloc->>'percentage')::NUMERIC / 100.0,
          2
        )
      );

      v_results := v_results || jsonb_build_object(
        'cost_center_id', v_alloc->>'cost_center_id',
        'percentage', (v_alloc->>'percentage')::NUMERIC,
        'amount', ROUND(
          GREATEST(v_line.amount_debit, v_line.amount_credit) * (v_alloc->>'percentage')::NUMERIC / 100.0,
          2
        )
      );
    END LOOP;
  END LOOP;

  RETURN json_build_object(
    'status', 'allocated',
    'transaction_id', p_transaction_id,
    'allocations', v_results
  );
END;
$$;

GRANT EXECUTE ON FUNCTION allocate_to_centers(UUID, UUID, JSONB) TO authenticated;


-- ─── 2. get_center_pnl ──────────────────────────────────────

CREATE OR REPLACE FUNCTION get_center_pnl(
  p_user_id UUID,
  p_center_id UUID,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from DATE := COALESCE(p_date_from, date_trunc('month', CURRENT_DATE)::DATE);
  v_to DATE := COALESCE(p_date_to, (date_trunc('month', CURRENT_DATE) + interval '1 month')::DATE);
  v_income NUMERIC := 0;
  v_expense NUMERIC := 0;
  v_center RECORD;
  v_monthly JSON;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_center FROM cost_centers
  WHERE id = p_center_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Centro não encontrado';
  END IF;

  -- From center_allocations (rateio)
  SELECT
    COALESCE(SUM(CASE WHEN coa.group_type = 'revenue' THEN ca.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN coa.group_type = 'expense' THEN ca.amount ELSE 0 END), 0)
  INTO v_income, v_expense
  FROM center_allocations ca
  JOIN journal_lines jl ON jl.id = ca.journal_line_id
  JOIN chart_of_accounts coa ON coa.id = jl.account_id
  JOIN journal_entries je ON je.id = jl.journal_entry_id
  JOIN transactions tx ON tx.journal_entry_id = je.id
  WHERE ca.cost_center_id = p_center_id
    AND tx.user_id = p_user_id
    AND tx.date >= v_from AND tx.date < v_to
    AND tx.is_deleted = false;

  -- Monthly breakdown
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.month), '[]'::JSON) INTO v_monthly
  FROM (
    SELECT
      date_trunc('month', tx.date)::DATE AS month,
      SUM(CASE WHEN coa.group_type = 'revenue' THEN ca.amount ELSE 0 END) AS income,
      SUM(CASE WHEN coa.group_type = 'expense' THEN ca.amount ELSE 0 END) AS expense
    FROM center_allocations ca
    JOIN journal_lines jl ON jl.id = ca.journal_line_id
    JOIN chart_of_accounts coa ON coa.id = jl.account_id
    JOIN journal_entries je ON je.id = jl.journal_entry_id
    JOIN transactions tx ON tx.journal_entry_id = je.id
    WHERE ca.cost_center_id = p_center_id
      AND tx.user_id = p_user_id
      AND tx.date >= v_from AND tx.date < v_to
      AND tx.is_deleted = false
    GROUP BY date_trunc('month', tx.date)
  ) t;

  RETURN json_build_object(
    'center_id', p_center_id,
    'center_name', v_center.name,
    'center_type', v_center.type,
    'period_from', v_from,
    'period_to', v_to,
    'total_income', ROUND(v_income, 2),
    'total_expense', ROUND(v_expense, 2),
    'net_result', ROUND(v_income - v_expense, 2),
    'monthly', v_monthly
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_center_pnl(UUID, UUID, DATE, DATE) TO authenticated;


-- ─── 3. get_center_export ─────────────────────────────────────

CREATE OR REPLACE FUNCTION get_center_export(
  p_user_id UUID,
  p_center_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_center RECORD;
  v_transactions JSON;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_center FROM cost_centers
  WHERE id = p_center_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Centro não encontrado';
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date DESC), '[]'::JSON) INTO v_transactions
  FROM (
    SELECT
      tx.id, tx.date, tx.type, tx.amount, tx.description, tx.is_paid,
      ca.percentage AS center_percentage,
      ca.amount AS center_amount,
      coa.display_name AS coa_name,
      coa.group_type
    FROM center_allocations ca
    JOIN journal_lines jl ON jl.id = ca.journal_line_id
    JOIN chart_of_accounts coa ON coa.id = jl.account_id
    JOIN journal_entries je ON je.id = jl.journal_entry_id
    JOIN transactions tx ON tx.journal_entry_id = je.id
    WHERE ca.cost_center_id = p_center_id
      AND tx.user_id = p_user_id
      AND tx.is_deleted = false
  ) t;

  RETURN json_build_object(
    'center', json_build_object(
      'id', v_center.id,
      'name', v_center.name,
      'type', v_center.type,
      'color', v_center.color,
      'created_at', v_center.created_at
    ),
    'transactions', v_transactions,
    'exported_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_center_export(UUID, UUID) TO authenticated;
