-- Migration: Add upcoming_bills to get_dashboard_all RPC
-- Eliminates separate query in UpcomingBillsCard (-150ms on dashboard load)
-- Applied to SP project mngjbrbxapazdddzgoje

CREATE OR REPLACE FUNCTION get_dashboard_all(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ms DATE := date_trunc('month', CURRENT_DATE)::DATE;
  v_me DATE := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::DATE;
  v_6m DATE := (CURRENT_DATE - INTERVAL '6 months')::DATE;
  v_today TEXT := to_char(CURRENT_DATE, 'YYYY-MM-DD');
  v_3d TEXT := to_char(CURRENT_DATE + INTERVAL '3 days', 'YYYY-MM-DD');
  v_7d TIMESTAMPTZ := NOW() - INTERVAL '7 days';

  v_total_current NUMERIC := 0;
  v_total_projected NUMERIC := 0;
  v_active_accounts INT := 0;
  v_month_income NUMERIC := 0;
  v_month_expense NUMERIC := 0;

  v_liquid NUMERIC := 0;
  v_illiquid NUMERIC := 0;
  v_liab NUMERIC := 0;

  v_t1 NUMERIC := 0; v_t2 NUMERIC := 0; v_t3 NUMERIC := 0; v_t4 NUMERIC := 0;
  v_br NUMERIC := 0; v_rw NUMERIC := 0; v_lcr NUMERIC := 0;
  v_md INT := 0; v_te NUMERIC := 0;

  v_categories JSON;
  v_evolution JSON;
  v_snapshot_count INT;
  v_budget JSON;

  v_uncat INT := 0; v_overdue INT := 0; v_due_soon INT := 0;
  v_recent_import INT := 0; v_last_tx_days INT;

  v_upcoming_bills JSON;
BEGIN
  IF p_user_id != auth.uid() THEN RAISE EXCEPTION 'Forbidden'; END IF;

  -- 1. SUMMARY
  SELECT
    COALESCE(SUM(CASE WHEN type IN ('credit_card','loan','financing') THEN -current_balance ELSE current_balance END * get_rate_to_brl(currency)), 0),
    COALESCE(SUM(CASE WHEN type IN ('credit_card','loan','financing') THEN -projected_balance ELSE projected_balance END * get_rate_to_brl(currency)), 0),
    COUNT(*)::INT
  INTO v_total_current, v_total_projected, v_active_accounts
  FROM accounts WHERE user_id = p_user_id AND is_active = true;

  SELECT
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END * get_rate_to_brl(a.currency)), 0),
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END * get_rate_to_brl(a.currency)), 0)
  INTO v_month_income, v_month_expense
  FROM transactions t
  JOIN accounts a ON a.id = t.account_id
  WHERE t.user_id = p_user_id AND t.date >= v_ms AND t.date < v_me AND t.is_deleted = false;

  -- 2. BALANCE SHEET
  SELECT COALESCE(SUM(current_balance * get_rate_to_brl(currency)), 0) INTO v_liquid
  FROM accounts WHERE user_id = p_user_id AND is_active = true
    AND type IN ('checking', 'savings', 'cash', 'investment');

  SELECT COALESCE(SUM(current_value * get_rate_to_brl(currency)), 0) INTO v_illiquid
  FROM assets WHERE user_id = p_user_id;

  SELECT COALESCE(SUM(current_balance * get_rate_to_brl(currency)), 0) INTO v_liab
  FROM accounts WHERE user_id = p_user_id AND is_active = true
    AND type IN ('credit_card', 'loan', 'financing');

  -- 3. SOLVENCY
  SELECT COALESCE(SUM(current_balance * get_rate_to_brl(currency)), 0) INTO v_t1
  FROM accounts WHERE user_id = p_user_id AND is_active = true
    AND type NOT IN ('credit_card','loan','financing') AND liquidity_tier = 'T1';

  SELECT COALESCE(SUM(current_balance * get_rate_to_brl(currency)), 0) INTO v_t2
  FROM accounts WHERE user_id = p_user_id AND is_active = true
    AND type NOT IN ('credit_card','loan','financing') AND liquidity_tier = 'T2';

  SELECT COALESCE(SUM(current_value * get_rate_to_brl(currency)), 0) INTO v_t3
  FROM assets WHERE user_id = p_user_id AND category != 'restricted';

  SELECT COALESCE(SUM(current_value * get_rate_to_brl(currency)), 0) INTO v_t4
  FROM assets WHERE user_id = p_user_id AND category = 'restricted';

  SELECT COALESCE(SUM(t.amount * get_rate_to_brl(a.currency)), 0),
         COUNT(DISTINCT date_trunc('month', t.date))::INT
  INTO v_te, v_md
  FROM transactions t
  JOIN accounts a ON a.id = t.account_id
  WHERE t.user_id = p_user_id AND t.type = 'expense' AND t.date >= v_6m AND t.is_deleted = false;

  IF v_md > 0 THEN v_br := v_te / v_md; END IF;
  IF v_br > 0 THEN
    v_rw := ROUND((v_t1 + v_t2) / v_br, 1);
    v_lcr := ROUND((v_t1 + v_t2) / (v_br * 6), 2);
  ELSE v_rw := 999; v_lcr := 999; END IF;

  -- 4. TOP CATEGORIES
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::JSON) INTO v_categories
  FROM (
    SELECT c.name AS category_name, c.icon, c.color,
           SUM(tx.amount * get_rate_to_brl(a.currency)) AS total,
           CASE WHEN v_month_expense > 0 THEN ROUND(SUM(tx.amount * get_rate_to_brl(a.currency)) / v_month_expense * 100, 1) ELSE 0 END AS percentage
    FROM transactions tx
    JOIN categories c ON c.id = tx.category_id
    JOIN accounts a ON a.id = tx.account_id
    WHERE tx.user_id = p_user_id AND tx.type = 'expense'
      AND tx.date >= v_ms AND tx.date < v_me AND tx.is_deleted = false
    GROUP BY c.id, c.name, c.icon, c.color
    ORDER BY SUM(tx.amount * get_rate_to_brl(a.currency)) DESC LIMIT 5
  ) t;

  -- 5. BALANCE EVOLUTION
  SELECT COUNT(*) INTO v_snapshot_count FROM monthly_snapshots WHERE user_id = p_user_id;

  IF v_snapshot_count >= 2 THEN
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.month), '[]'::JSON) INTO v_evolution
    FROM (SELECT month, total_balance AS balance, total_projected AS projected,
                 total_income AS income, total_expense AS expense
          FROM monthly_snapshots WHERE user_id = p_user_id ORDER BY month DESC LIMIT 6) t;
  ELSE
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.month), '[]'::JSON) INTO v_evolution
    FROM (SELECT date_trunc('month', tx.date)::DATE AS month,
                 SUM(CASE WHEN tx.type='income' THEN tx.amount * get_rate_to_brl(a.currency) ELSE 0 END) AS income,
                 SUM(CASE WHEN tx.type='expense' THEN tx.amount * get_rate_to_brl(a.currency) ELSE 0 END) AS expense,
                 SUM(CASE WHEN tx.type='income' THEN tx.amount * get_rate_to_brl(a.currency) ELSE -(tx.amount * get_rate_to_brl(a.currency)) END) AS balance,
                 0 AS projected
          FROM transactions tx
          JOIN accounts a ON a.id = tx.account_id
          WHERE tx.user_id = p_user_id AND tx.is_deleted = false AND tx.date >= v_6m
          GROUP BY date_trunc('month', tx.date) ORDER BY month DESC LIMIT 6) t;
  END IF;

  -- 6. BUDGET VS ACTUAL
  SELECT json_build_object(
    'items', COALESCE((
      SELECT json_agg(row_to_json(sub))
      FROM (
        SELECT b.id, b.category_id, c.name as category_name, c.icon as category_icon,
               c.color as category_color, b.planned_amount as planned, b.alert_threshold,
               COALESCE((SELECT SUM(t.amount * get_rate_to_brl(a.currency))
                 FROM transactions t JOIN accounts a ON a.id = t.account_id
                 WHERE t.user_id = p_user_id AND t.category_id = b.category_id
                   AND t.type = 'expense' AND t.is_deleted = false AND t.is_paid = true
                   AND t.date >= v_ms AND t.date < v_me), 0) as actual,
               b.planned_amount - COALESCE((SELECT SUM(t.amount * get_rate_to_brl(a.currency))
                 FROM transactions t JOIN accounts a ON a.id = t.account_id
                 WHERE t.user_id = p_user_id AND t.category_id = b.category_id
                   AND t.type = 'expense' AND t.is_deleted = false AND t.is_paid = true
                   AND t.date >= v_ms AND t.date < v_me), 0) as remaining,
               CASE WHEN b.planned_amount > 0 THEN ROUND(COALESCE((SELECT SUM(t.amount * get_rate_to_brl(a.currency))
                 FROM transactions t JOIN accounts a ON a.id = t.account_id
                 WHERE t.user_id = p_user_id AND t.category_id = b.category_id
                   AND t.type = 'expense' AND t.is_deleted = false AND t.is_paid = true
                   AND t.date >= v_ms AND t.date < v_me), 0) / b.planned_amount * 100, 1) ELSE 0 END as pct_used,
               CASE
                 WHEN b.planned_amount > 0 AND COALESCE((SELECT SUM(t.amount * get_rate_to_brl(a.currency))
                   FROM transactions t JOIN accounts a ON a.id = t.account_id
                   WHERE t.user_id = p_user_id AND t.category_id = b.category_id
                     AND t.type = 'expense' AND t.is_deleted = false AND t.is_paid = true
                     AND t.date >= v_ms AND t.date < v_me), 0) >= b.planned_amount THEN 'exceeded'
                 WHEN b.planned_amount > 0 AND b.alert_threshold > 0 AND COALESCE((SELECT SUM(t.amount * get_rate_to_brl(a.currency))
                   FROM transactions t JOIN accounts a ON a.id = t.account_id
                   WHERE t.user_id = p_user_id AND t.category_id = b.category_id
                     AND t.type = 'expense' AND t.is_deleted = false AND t.is_paid = true
                     AND t.date >= v_ms AND t.date < v_me), 0) / b.planned_amount * 100 >= b.alert_threshold THEN 'warning'
                 ELSE 'ok' END as status,
               b.family_member_id
        FROM budgets b JOIN categories c ON c.id = b.category_id
        WHERE b.user_id = p_user_id AND b.month = v_ms ORDER BY c.name
      ) sub
    ), '[]'::json),
    'total_planned', COALESCE((SELECT SUM(planned_amount) FROM budgets WHERE user_id = p_user_id AND month = v_ms), 0),
    'total_actual', COALESCE((SELECT SUM(t.amount * get_rate_to_brl(a.currency))
      FROM transactions t JOIN accounts a ON a.id = t.account_id
      WHERE t.user_id = p_user_id AND t.type = 'expense' AND t.is_deleted = false AND t.is_paid = true
        AND t.date >= v_ms AND t.date < v_me
        AND t.category_id IN (SELECT category_id FROM budgets WHERE user_id = p_user_id AND month = v_ms)), 0),
    'total_remaining', COALESCE((SELECT SUM(planned_amount) FROM budgets WHERE user_id = p_user_id AND month = v_ms), 0)
      - COALESCE((SELECT SUM(t.amount * get_rate_to_brl(a.currency))
        FROM transactions t JOIN accounts a ON a.id = t.account_id
        WHERE t.user_id = p_user_id AND t.type = 'expense' AND t.is_deleted = false AND t.is_paid = true
          AND t.date >= v_ms AND t.date < v_me
          AND t.category_id IN (SELECT category_id FROM budgets WHERE user_id = p_user_id AND month = v_ms)), 0),
    'pct_used', CASE WHEN COALESCE((SELECT SUM(planned_amount) FROM budgets WHERE user_id = p_user_id AND month = v_ms), 0) > 0 THEN
      ROUND(COALESCE((SELECT SUM(t.amount * get_rate_to_brl(a.currency))
        FROM transactions t JOIN accounts a ON a.id = t.account_id
        WHERE t.user_id = p_user_id AND t.type = 'expense' AND t.is_deleted = false AND t.is_paid = true
          AND t.date >= v_ms AND t.date < v_me
          AND t.category_id IN (SELECT category_id FROM budgets WHERE user_id = p_user_id AND month = v_ms)
      ), 0) / NULLIF((SELECT SUM(planned_amount) FROM budgets WHERE user_id = p_user_id AND month = v_ms), 0) * 100, 1)
    ELSE 0 END,
    'month', v_ms,
    'budget_count', (SELECT count(*) FROM budgets WHERE user_id = p_user_id AND month = v_ms)
  ) INTO v_budget;

  -- 7. ATTENTION QUEUE
  SELECT COUNT(*)::INT INTO v_uncat
  FROM transactions WHERE user_id = p_user_id AND category_id IS NULL AND is_deleted = false;

  SELECT COUNT(*)::INT INTO v_overdue
  FROM transactions WHERE user_id = p_user_id AND payment_status = 'overdue' AND is_deleted = false;

  SELECT COUNT(*)::INT INTO v_due_soon
  FROM transactions WHERE user_id = p_user_id AND payment_status = 'pending' AND is_deleted = false
    AND due_date IS NOT NULL AND due_date::text <= v_3d AND due_date::text >= v_today;

  SELECT COUNT(*)::INT INTO v_recent_import
  FROM transactions WHERE user_id = p_user_id AND import_batch_id IS NOT NULL
    AND created_at >= v_7d AND is_deleted = false;

  SELECT EXTRACT(DAY FROM NOW() - MAX(created_at))::INT INTO v_last_tx_days
  FROM transactions WHERE user_id = p_user_id AND is_deleted = false;

  -- 8. UPCOMING BILLS (top 5 pending, ordered by date)
  SELECT COALESCE(json_agg(row_to_json(ub)), '[]'::JSON) INTO v_upcoming_bills
  FROM (
    SELECT t.id, t.description, t.amount, t.date, t.type,
           a.name AS account_name,
           c.name AS category_name
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE t.user_id = p_user_id
      AND t.is_paid = false
      AND t.is_deleted = false
      AND t.date >= CURRENT_DATE
    ORDER BY t.date ASC
    LIMIT 5
  ) ub;

  -- BUILD RESULT
  RETURN json_build_object(
    'summary', json_build_object(
      'total_current_balance', ROUND(v_total_current, 2), 'total_projected_balance', ROUND(v_total_projected, 2),
      'active_accounts', v_active_accounts, 'month_income', ROUND(v_month_income, 2),
      'month_expense', ROUND(v_month_expense, 2), 'month_start', v_ms, 'month_end', v_me),
    'balance_sheet', json_build_object(
      'liquid_assets', ROUND(v_liquid, 2), 'illiquid_assets', ROUND(v_illiquid, 2),
      'total_assets', ROUND(v_liquid + v_illiquid, 2),
      'total_liabilities', ROUND(v_liab, 2),
      'net_worth', ROUND(v_liquid + v_illiquid - v_liab, 2)),
    'solvency', json_build_object(
      'tier1_total', ROUND(v_t1, 2), 'tier2_total', ROUND(v_t2, 2),
      'tier3_total', ROUND(v_t3, 2), 'tier4_total', ROUND(v_t4, 2),
      'total_patrimony', ROUND(v_t1 + v_t2 + v_t3 + v_t4, 2),
      'burn_rate', ROUND(v_br, 2), 'runway_months', v_rw, 'lcr', v_lcr,
      'months_analyzed', v_md),
    'top_categories', json_build_object('categories', v_categories, 'total_expense', ROUND(v_month_expense, 2), 'month', v_ms),
    'evolution', json_build_object('data', v_evolution, 'source', CASE WHEN v_snapshot_count >= 2 THEN 'snapshots' ELSE 'calculated' END, 'months_requested', 6),
    'budget', v_budget,
    'attention', json_build_object('uncategorized', v_uncat, 'overdue', v_overdue,
      'dueSoon', v_due_soon, 'recentImportCount', v_recent_import, 'lastTransactionDaysAgo', v_last_tx_days),
    'upcoming_bills', v_upcoming_bills
  );
END;
$function$;
