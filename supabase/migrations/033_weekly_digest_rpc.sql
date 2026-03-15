-- 033: UX-H3-03 Weekly digest data RPC

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
  -- Previous week (Mon-Sun)
  _week_end := date_trunc('week', current_date)::date - 1;  -- Last Sunday
  _week_start := _week_end - 6;  -- Previous Monday

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
        GROUP BY c.name
        ORDER BY total DESC
        LIMIT 3
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

COMMENT ON FUNCTION get_weekly_digest IS 'UX-H3-03: Aggregates weekly financial data for email digest (previous Mon-Sun)';
