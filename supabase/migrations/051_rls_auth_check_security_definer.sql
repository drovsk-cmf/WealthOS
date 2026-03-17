-- Migration 051: Add auth.uid() validation to SECURITY DEFINER functions
-- Fixes: get_weekly_digest (data leak), get_budget_vs_actual int overload (data leak)
-- See 052 for create_default_categories restore.

-- 1. get_weekly_digest: CRITICAL - was returning financial data for any user
CREATE OR REPLACE FUNCTION get_weekly_digest(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result jsonb;
  _week_start date;
  _week_end date;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  _week_end := date_trunc('week', current_date)::date - 1;
  _week_start := _week_end - 6;

  SELECT jsonb_build_object(
    'week_start', _week_start,
    'week_end', _week_end,
    'total_income', COALESCE((
      SELECT SUM(amount) FROM transactions
      WHERE user_id = p_user_id AND type = 'income' AND is_deleted = false
        AND date BETWEEN _week_start AND _week_end AND is_paid = true
    ), 0),
    'total_expense', COALESCE((
      SELECT SUM(amount) FROM transactions
      WHERE user_id = p_user_id AND type = 'expense' AND is_deleted = false
        AND date BETWEEN _week_start AND _week_end AND is_paid = true
    ), 0),
    'transaction_count', (
      SELECT COUNT(*) FROM transactions
      WHERE user_id = p_user_id AND is_deleted = false
        AND date BETWEEN _week_start AND _week_end
    ),
    'top_categories', COALESCE((
      SELECT jsonb_agg(row_to_json(tc))
      FROM (
        SELECT c.name as category_name, SUM(t.amount) as total
        FROM transactions t
        JOIN categories c ON c.id = t.category_id
        WHERE t.user_id = p_user_id AND t.type = 'expense' AND t.is_deleted = false
          AND t.date BETWEEN _week_start AND _week_end AND t.is_paid = true
        GROUP BY c.name ORDER BY total DESC LIMIT 3
      ) tc
    ), '[]'::jsonb),
    'pending_count', (
      SELECT COUNT(*) FROM transactions
      WHERE user_id = p_user_id AND is_deleted = false
        AND is_paid = false AND date <= current_date
    ),
    'uncategorized_count', (
      SELECT COUNT(*) FROM transactions
      WHERE user_id = p_user_id AND is_deleted = false
        AND category_id IS NULL
    )
  ) INTO _result;

  RETURN _result;
END;
$$;

-- 2. get_budget_vs_actual (integer overload): was missing auth check
CREATE OR REPLACE FUNCTION get_budget_vs_actual(
  p_user_id uuid,
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_family_member_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INT := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INT);
  v_month INT := COALESCE(p_month, EXTRACT(MONTH FROM CURRENT_DATE)::INT);
  v_month_start DATE := make_date(v_year, v_month, 1);
  v_month_end DATE := (v_month_start + INTERVAL '1 month')::DATE;
  v_result JSON;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT json_build_object(
    'items', COALESCE((
      SELECT json_agg(row_to_json(sub))
      FROM (
        SELECT b.id, b.category_id, c.name as category_name, c.color as category_color,
          b.amount as planned,
          COALESCE((SELECT SUM(t.amount) FROM transactions t
            WHERE t.user_id = p_user_id AND t.category_id = b.category_id AND t.type = 'expense'
              AND t.is_deleted = false AND t.is_paid = true
              AND t.date >= v_month_start AND t.date < v_month_end
              AND (p_family_member_id IS NULL OR t.family_member_id = p_family_member_id)
          ), 0) as actual,
          b.amount - COALESCE((SELECT SUM(t.amount) FROM transactions t
            WHERE t.user_id = p_user_id AND t.category_id = b.category_id AND t.type = 'expense'
              AND t.is_deleted = false AND t.is_paid = true
              AND t.date >= v_month_start AND t.date < v_month_end
              AND (p_family_member_id IS NULL OR t.family_member_id = p_family_member_id)
          ), 0) as remaining,
          CASE WHEN b.amount > 0 THEN ROUND(COALESCE((SELECT SUM(t.amount) FROM transactions t
            WHERE t.user_id = p_user_id AND t.category_id = b.category_id AND t.type = 'expense'
              AND t.is_deleted = false AND t.is_paid = true
              AND t.date >= v_month_start AND t.date < v_month_end
              AND (p_family_member_id IS NULL OR t.family_member_id = p_family_member_id)
          ), 0) / b.amount * 100, 1) ELSE 0 END as pct_used,
          b.approval_status, b.family_member_id, fm.name as family_member_name
        FROM budgets b
        JOIN categories c ON c.id = b.category_id
        LEFT JOIN family_members fm ON fm.id = b.family_member_id
        WHERE b.user_id = p_user_id AND b.month = v_month_start
          AND (p_family_member_id IS NULL OR b.family_member_id = p_family_member_id)
        ORDER BY c.name
      ) sub
    ), '[]'::json),
    'total_planned', COALESCE((SELECT SUM(b.amount) FROM budgets b WHERE b.user_id = p_user_id AND b.month = v_month_start AND (p_family_member_id IS NULL OR b.family_member_id = p_family_member_id)), 0),
    'total_actual', COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.user_id = p_user_id AND t.type = 'expense' AND t.is_deleted = false AND t.is_paid = true AND t.date >= v_month_start AND t.date < v_month_end AND (p_family_member_id IS NULL OR t.family_member_id = p_family_member_id) AND t.category_id IN (SELECT category_id FROM budgets WHERE user_id = p_user_id AND month = v_month_start)), 0),
    'total_remaining', COALESCE((SELECT SUM(b.amount) FROM budgets b WHERE b.user_id = p_user_id AND b.month = v_month_start AND (p_family_member_id IS NULL OR b.family_member_id = p_family_member_id)), 0) - COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.user_id = p_user_id AND t.type = 'expense' AND t.is_deleted = false AND t.is_paid = true AND t.date >= v_month_start AND t.date < v_month_end AND (p_family_member_id IS NULL OR t.family_member_id = p_family_member_id) AND t.category_id IN (SELECT category_id FROM budgets WHERE user_id = p_user_id AND month = v_month_start)), 0),
    'pct_used', CASE WHEN COALESCE((SELECT SUM(b.amount) FROM budgets b WHERE b.user_id = p_user_id AND b.month = v_month_start AND (p_family_member_id IS NULL OR b.family_member_id = p_family_member_id)), 0) > 0 THEN ROUND(COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.user_id = p_user_id AND t.type = 'expense' AND t.is_deleted = false AND t.is_paid = true AND t.date >= v_month_start AND t.date < v_month_end AND (p_family_member_id IS NULL OR t.family_member_id = p_family_member_id) AND t.category_id IN (SELECT category_id FROM budgets WHERE user_id = p_user_id AND month = v_month_start)), 0) / NULLIF((SELECT SUM(b.amount) FROM budgets b WHERE b.user_id = p_user_id AND b.month = v_month_start AND (p_family_member_id IS NULL OR b.family_member_id = p_family_member_id)), 0) * 100, 1) ELSE 0 END,
    'month', v_month_start,
    'budget_count', (SELECT count(*) FROM budgets WHERE user_id = p_user_id AND month = v_month_start AND (p_family_member_id IS NULL OR family_member_id = p_family_member_id))
  ) INTO v_result;

  RETURN v_result;
END;
$$;
