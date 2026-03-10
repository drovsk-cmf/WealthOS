-- =====================================================
-- 1. RPC: create_coa_child
-- Creates an individual COA leaf under a parent.
-- Used by both auto-creation (account hook) and manual UI.
-- =====================================================
CREATE OR REPLACE FUNCTION create_coa_child(
  p_user_id UUID,
  p_parent_id UUID DEFAULT NULL,
  p_parent_code TEXT DEFAULT NULL,
  p_display_name TEXT DEFAULT '',
  p_account_name TEXT DEFAULT NULL,
  p_tax_treatment tax_treatment_type DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent RECORD;
  v_next_seq INT;
  v_new_code TEXT;
  v_new_id UUID;
BEGIN
  -- Auth check
  IF p_user_id != (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Resolve parent: by ID or by code
  IF p_parent_id IS NOT NULL THEN
    SELECT id, internal_code, group_type, sort_order, depth, tax_treatment
    INTO v_parent
    FROM chart_of_accounts
    WHERE id = p_parent_id AND user_id = p_user_id;
  ELSIF p_parent_code IS NOT NULL THEN
    SELECT id, internal_code, group_type, sort_order, depth, tax_treatment
    INTO v_parent
    FROM chart_of_accounts
    WHERE internal_code = p_parent_code AND user_id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Either p_parent_id or p_parent_code is required';
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent COA not found';
  END IF;

  -- Next sequence: max existing child seq + 1
  SELECT COALESCE(MAX(
    CAST(REPLACE(internal_code, v_parent.internal_code || '.', '') AS INT)
  ), 0) + 1
  INTO v_next_seq
  FROM chart_of_accounts
  WHERE user_id = p_user_id AND parent_id = v_parent.id;

  -- Generate code: parent_code.NNN
  v_new_code := v_parent.internal_code || '.' || LPAD(v_next_seq::TEXT, 3, '0');

  -- Insert
  INSERT INTO chart_of_accounts (
    user_id, parent_id, internal_code, account_name, display_name,
    group_type, depth, is_active, is_system, sort_order,
    tax_treatment
  ) VALUES (
    p_user_id,
    v_parent.id,
    v_new_code,
    COALESCE(p_account_name, p_display_name),
    p_display_name,
    v_parent.group_type,
    v_parent.depth + 1,
    true,
    false,
    v_parent.sort_order,
    COALESCE(p_tax_treatment, v_parent.tax_treatment)
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- =====================================================
-- 2. Update get_balance_sheet: include loan/financing as liabilities
-- =====================================================
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
  IF p_user_id != (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Liquid assets: checking, savings, cash, investment
  SELECT COALESCE(SUM(current_balance), 0) INTO v_liquid_assets
  FROM accounts
  WHERE user_id = p_user_id
    AND is_active = true
    AND type IN ('checking', 'savings', 'cash', 'investment');

  -- Illiquid assets: real estate, vehicles, etc.
  SELECT COALESCE(SUM(current_value), 0) INTO v_illiquid_assets
  FROM assets
  WHERE user_id = p_user_id;

  v_total_assets := v_liquid_assets + v_illiquid_assets;

  -- Liabilities: credit cards + loans + financings
  SELECT COALESCE(SUM(current_balance), 0) INTO v_total_liabilities
  FROM accounts
  WHERE user_id = p_user_id
    AND is_active = true
    AND type IN ('credit_card', 'loan', 'financing');

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

-- =====================================================
-- 3. Update get_dashboard_summary: negate loan/financing
-- =====================================================
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
  IF p_user_id != (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT json_build_object(
    'total_current_balance', COALESCE((
      SELECT SUM(
        CASE WHEN type IN ('credit_card', 'loan', 'financing') THEN -current_balance
             ELSE current_balance END
      ) FROM accounts WHERE user_id = p_user_id AND is_active = true
    ), 0),
    'total_projected_balance', COALESCE((
      SELECT SUM(
        CASE WHEN type IN ('credit_card', 'loan', 'financing') THEN -projected_balance
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

-- =====================================================
-- 4. Update get_solvency_metrics: exclude loan/financing from tier1
-- =====================================================
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
  IF p_user_id != (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Tier 1: checking, savings, cash + investments T1
  SELECT COALESCE(SUM(current_balance), 0) INTO v_tier1
  FROM accounts
  WHERE user_id = p_user_id AND is_active = true
    AND type NOT IN ('credit_card', 'loan', 'financing')
    AND liquidity_tier = 'T1';

  -- Tier 2: investments T2
  SELECT COALESCE(SUM(current_balance), 0) INTO v_tier2
  FROM accounts
  WHERE user_id = p_user_id AND is_active = true
    AND type NOT IN ('credit_card', 'loan', 'financing')
    AND liquidity_tier = 'T2';

  -- Tier 3: assets exceto restricted
  SELECT COALESCE(SUM(current_value), 0) INTO v_tier3
  FROM assets
  WHERE user_id = p_user_id AND category != 'restricted';

  -- Tier 4: assets restricted
  SELECT COALESCE(SUM(current_value), 0) INTO v_tier4
  FROM assets
  WHERE user_id = p_user_id AND category = 'restricted';

  -- Burn Rate
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

  IF v_burn_rate > 0 THEN
    v_runway := ROUND((v_tier1 + v_tier2) / v_burn_rate, 1);
    v_lcr := ROUND((v_tier1 + v_tier2) / (v_burn_rate * 6), 2);
  ELSE
    v_runway := 999;
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
