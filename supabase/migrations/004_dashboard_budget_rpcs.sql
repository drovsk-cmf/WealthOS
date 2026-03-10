-- ============================================
-- WealthOS - Migration 004: Dashboard & Budget RPCs
-- ============================================
-- Phase 3: DASH-01 to DASH-12, CTB-05, ORC-05
-- 6 RPCs for dashboard + budget aggregations
-- ============================================

-- ─── 1. get_dashboard_summary ─────────────────────────────────
-- Stories: DASH-01 (saldo consolidado), DASH-02 (receitas vs despesas)
-- Returns: account totals + current month income/expense

CREATE OR REPLACE FUNCTION get_dashboard_summary(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_start DATE := date_trunc('month', CURRENT_DATE)::DATE;
  v_month_end DATE := (date_trunc('month', CURRENT_DATE) + interval '1 month')::DATE;
  v_result JSON;
BEGIN
  -- Auth check
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT json_build_object(
    'total_current_balance', COALESCE((
      SELECT SUM(
        CASE WHEN type = 'credit_card' THEN -current_balance
             ELSE current_balance END
      ) FROM accounts WHERE user_id = p_user_id AND is_active = true
    ), 0),
    'total_projected_balance', COALESCE((
      SELECT SUM(
        CASE WHEN type = 'credit_card' THEN -projected_balance
             ELSE projected_balance END
      ) FROM accounts WHERE user_id = p_user_id AND is_active = true
    ), 0),
    'active_accounts', COALESCE((
      SELECT COUNT(*)::INT FROM accounts WHERE user_id = p_user_id AND is_active = true
    ), 0),
    'month_income', COALESCE((
      SELECT SUM(amount) FROM transactions
      WHERE user_id = p_user_id
        AND type = 'income'
        AND date >= v_month_start AND date < v_month_end
        AND is_deleted = false
    ), 0),
    'month_expense', COALESCE((
      SELECT SUM(amount) FROM transactions
      WHERE user_id = p_user_id
        AND type = 'expense'
        AND date >= v_month_start AND date < v_month_end
        AND is_deleted = false
    ), 0),
    'month_start', v_month_start,
    'month_end', v_month_end
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_summary(UUID) TO authenticated;


-- ─── 2. get_balance_sheet ─────────────────────────────────────
-- Story: CTB-05 (balanço patrimonial no Dashboard)
-- Returns: total assets, liabilities, net worth
-- Sources: accounts (liquid) + assets (illiquid) for assets side;
--          credit_card balances for liabilities side

CREATE OR REPLACE FUNCTION get_balance_sheet(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_liquid_assets NUMERIC := 0;
  v_illiquid_assets NUMERIC := 0;
  v_total_assets NUMERIC := 0;
  v_total_liabilities NUMERIC := 0;
  v_net_worth NUMERIC := 0;
  v_result JSON;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Liquid assets: checking, savings, cash, investment (positive balances)
  SELECT COALESCE(SUM(current_balance), 0) INTO v_liquid_assets
  FROM accounts
  WHERE user_id = p_user_id
    AND is_active = true
    AND type IN ('checking', 'savings', 'cash', 'investment');

  -- Illiquid assets: real estate, vehicles, electronics, other, restricted
  SELECT COALESCE(SUM(current_value), 0) INTO v_illiquid_assets
  FROM assets
  WHERE user_id = p_user_id;

  v_total_assets := v_liquid_assets + v_illiquid_assets;

  -- Liabilities: credit card outstanding balance
  SELECT COALESCE(SUM(current_balance), 0) INTO v_total_liabilities
  FROM accounts
  WHERE user_id = p_user_id
    AND is_active = true
    AND type = 'credit_card';

  v_net_worth := v_total_assets - v_total_liabilities;

  SELECT json_build_object(
    'liquid_assets', v_liquid_assets,
    'illiquid_assets', v_illiquid_assets,
    'total_assets', v_total_assets,
    'total_liabilities', v_total_liabilities,
    'net_worth', v_net_worth
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_balance_sheet(UUID) TO authenticated;


-- ─── 3. get_solvency_metrics ──────────────────────────────────
-- Stories: DASH-09 (LCR), DASH-10 (Runway), DASH-11 (Burn Rate), DASH-12 (Tiers)
-- LCR = (T1 + T2) / (Burn Rate × 6)
-- Runway = (T1 + T2) / Burn Rate
-- Burn Rate = average monthly expense over last 6 months

CREATE OR REPLACE FUNCTION get_solvency_metrics(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier1 NUMERIC := 0;
  v_tier2 NUMERIC := 0;
  v_tier3 NUMERIC := 0;
  v_tier4 NUMERIC := 0;
  v_burn_rate NUMERIC := 0;
  v_runway NUMERIC := 0;
  v_lcr NUMERIC := 0;
  v_months_with_data INT := 0;
  v_total_expense_6m NUMERIC := 0;
  v_six_months_ago DATE := (CURRENT_DATE - interval '6 months')::DATE;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Tier 1 (imediato): checking, savings, cash + investments T1
  SELECT COALESCE(SUM(current_balance), 0) INTO v_tier1
  FROM accounts
  WHERE user_id = p_user_id AND is_active = true
    AND type != 'credit_card'
    AND liquidity_tier = 'T1';

  -- Tier 2 (líquido): investments T2
  SELECT COALESCE(SUM(current_balance), 0) INTO v_tier2
  FROM accounts
  WHERE user_id = p_user_id AND is_active = true
    AND liquidity_tier = 'T2';

  -- Tier 3 (ilíquido): assets exceto restricted
  SELECT COALESCE(SUM(current_value), 0) INTO v_tier3
  FROM assets
  WHERE user_id = p_user_id
    AND category != 'restricted';

  -- Tier 4 (restrito): assets restricted
  SELECT COALESCE(SUM(current_value), 0) INTO v_tier4
  FROM assets
  WHERE user_id = p_user_id
    AND category = 'restricted';

  -- Burn Rate: average monthly expense over last 6 months
  SELECT
    COALESCE(SUM(amount), 0),
    COUNT(DISTINCT date_trunc('month', date))::INT
  INTO v_total_expense_6m, v_months_with_data
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND date >= v_six_months_ago
    AND is_deleted = false;

  IF v_months_with_data > 0 THEN
    v_burn_rate := v_total_expense_6m / v_months_with_data;
  END IF;

  -- Runway = liquid assets / burn rate (months)
  IF v_burn_rate > 0 THEN
    v_runway := ROUND((v_tier1 + v_tier2) / v_burn_rate, 1);
    v_lcr := ROUND((v_tier1 + v_tier2) / (v_burn_rate * 6), 2);
  ELSE
    v_runway := 999; -- infinite runway if no expenses
    v_lcr := 999;
  END IF;

  RETURN json_build_object(
    'tier1_total', ROUND(v_tier1, 2),
    'tier2_total', ROUND(v_tier2, 2),
    'tier3_total', ROUND(v_tier3, 2),
    'tier4_total', ROUND(v_tier4, 2),
    'total_patrimony', ROUND(v_tier1 + v_tier2 + v_tier3 + v_tier4, 2),
    'burn_rate', ROUND(v_burn_rate, 2),
    'runway_months', v_runway,
    'lcr', v_lcr,
    'months_analyzed', v_months_with_data
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_solvency_metrics(UUID) TO authenticated;


-- ─── 4. get_top_categories ────────────────────────────────────
-- Story: DASH-03 (top categorias de gasto do mês)
-- Returns: array of {category_name, icon, color, total, percentage}

CREATE OR REPLACE FUNCTION get_top_categories(
  p_user_id UUID,
  p_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT,
  p_month INT DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::INT,
  p_limit INT DEFAULT 5
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_start DATE;
  v_month_end DATE;
  v_total_expense NUMERIC := 0;
  v_result JSON;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  v_month_start := make_date(p_year, p_month, 1);
  v_month_end := v_month_start + interval '1 month';

  -- Total expense for percentage calculation
  SELECT COALESCE(SUM(amount), 0) INTO v_total_expense
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND date >= v_month_start AND date < v_month_end
    AND is_deleted = false;

  -- Top categories
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::JSON) INTO v_result
  FROM (
    SELECT
      c.name AS category_name,
      c.icon,
      c.color,
      SUM(tx.amount) AS total,
      CASE WHEN v_total_expense > 0
        THEN ROUND(SUM(tx.amount) / v_total_expense * 100, 1)
        ELSE 0
      END AS percentage
    FROM transactions tx
    JOIN categories c ON c.id = tx.category_id
    WHERE tx.user_id = p_user_id
      AND tx.type = 'expense'
      AND tx.date >= v_month_start AND tx.date < v_month_end
      AND tx.is_deleted = false
    GROUP BY c.id, c.name, c.icon, c.color
    ORDER BY SUM(tx.amount) DESC
    LIMIT p_limit
  ) t;

  RETURN json_build_object(
    'categories', v_result,
    'total_expense', v_total_expense,
    'month', v_month_start
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_top_categories(UUID, INT, INT, INT) TO authenticated;


-- ─── 5. get_balance_evolution ─────────────────────────────────
-- Story: DASH-07 (evolução do saldo nos últimos N meses)
-- Returns: array of {month, balance, projected, income, expense}
-- Source: monthly_snapshots if available, else calculated from transactions

CREATE OR REPLACE FUNCTION get_balance_evolution(
  p_user_id UUID,
  p_months INT DEFAULT 6
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_snapshot_count INT;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Check if we have snapshot data
  SELECT COUNT(*) INTO v_snapshot_count
  FROM monthly_snapshots
  WHERE user_id = p_user_id;

  IF v_snapshot_count >= 2 THEN
    -- Use snapshots
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.month), '[]'::JSON) INTO v_result
    FROM (
      SELECT
        month,
        total_balance AS balance,
        total_projected AS projected,
        total_income AS income,
        total_expense AS expense
      FROM monthly_snapshots
      WHERE user_id = p_user_id
      ORDER BY month DESC
      LIMIT p_months
    ) t;
  ELSE
    -- Calculate from transactions grouped by month
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.month), '[]'::JSON) INTO v_result
    FROM (
      SELECT
        date_trunc('month', date)::DATE AS month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS balance,
        0 AS projected
      FROM transactions
      WHERE user_id = p_user_id
        AND is_deleted = false
        AND date >= (CURRENT_DATE - (p_months || ' months')::INTERVAL)::DATE
      GROUP BY date_trunc('month', date)
      ORDER BY month DESC
      LIMIT p_months
    ) t;
  END IF;

  RETURN json_build_object(
    'data', v_result,
    'source', CASE WHEN v_snapshot_count >= 2 THEN 'snapshots' ELSE 'calculated' END,
    'months_requested', p_months
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_balance_evolution(UUID, INT) TO authenticated;


-- ─── 6. get_budget_vs_actual ──────────────────────────────────
-- Stories: DASH-05 (resumo orçamento), ORC-05 (relatório mensal)
-- Returns: array of {category, planned, actual, remaining, pct_used}

CREATE OR REPLACE FUNCTION get_budget_vs_actual(
  p_user_id UUID,
  p_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT,
  p_month INT DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_date DATE;
  v_month_end DATE;
  v_result JSON;
  v_total_planned NUMERIC := 0;
  v_total_actual NUMERIC := 0;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  v_month_date := make_date(p_year, p_month, 1);
  v_month_end := v_month_date + interval '1 month';

  -- Get budget items with actual spending
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.pct_used DESC), '[]'::JSON) INTO v_result
  FROM (
    SELECT
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color,
      b.id AS budget_id,
      b.planned_amount AS planned,
      b.alert_threshold,
      COALESCE(actuals.total, 0) AS actual,
      b.planned_amount - COALESCE(actuals.total, 0) AS remaining,
      CASE WHEN b.planned_amount > 0
        THEN ROUND(COALESCE(actuals.total, 0) / b.planned_amount * 100, 1)
        ELSE 0
      END AS pct_used,
      CASE
        WHEN b.planned_amount > 0 AND COALESCE(actuals.total, 0) >= b.planned_amount THEN 'exceeded'
        WHEN b.planned_amount > 0 AND COALESCE(actuals.total, 0) >= b.planned_amount * b.alert_threshold / 100.0 THEN 'warning'
        ELSE 'ok'
      END AS status
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    LEFT JOIN LATERAL (
      SELECT SUM(tx.amount) AS total
      FROM transactions tx
      WHERE tx.user_id = p_user_id
        AND tx.category_id = b.category_id
        AND tx.type = 'expense'
        AND tx.date >= v_month_date AND tx.date < v_month_end
        AND tx.is_deleted = false
    ) actuals ON true
    WHERE b.user_id = p_user_id
      AND b.month = v_month_date
  ) t;

  -- Totals
  SELECT
    COALESCE(SUM(b.planned_amount), 0),
    COALESCE(SUM(actuals.total), 0)
  INTO v_total_planned, v_total_actual
  FROM budgets b
  LEFT JOIN LATERAL (
    SELECT SUM(tx.amount) AS total
    FROM transactions tx
    WHERE tx.user_id = p_user_id
      AND tx.category_id = b.category_id
      AND tx.type = 'expense'
      AND tx.date >= v_month_date AND tx.date < v_month_end
      AND tx.is_deleted = false
  ) actuals ON true
  WHERE b.user_id = p_user_id
    AND b.month = v_month_date;

  RETURN json_build_object(
    'items', v_result,
    'total_planned', v_total_planned,
    'total_actual', v_total_actual,
    'total_remaining', v_total_planned - v_total_actual,
    'pct_used', CASE WHEN v_total_planned > 0
      THEN ROUND(v_total_actual / v_total_planned * 100, 1)
      ELSE 0
    END,
    'month', v_month_date,
    'budget_count', (SELECT COUNT(*) FROM budgets WHERE user_id = p_user_id AND month = v_month_date)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_budget_vs_actual(UUID, INT, INT) TO authenticated;
