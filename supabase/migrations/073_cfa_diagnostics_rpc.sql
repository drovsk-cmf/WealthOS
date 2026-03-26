-- ══════════════════════════════════════════════════════════════
-- get_cfa_diagnostics: Camada A (6 métricas) + Camada B (5 análises)
-- Retorna JSON com diagnóstico financeiro completo baseado em CFA L1
-- Conceitos: Savings Rate, HHI, WACC pessoal, D/E, Working Capital,
--            Breakeven, Income CV, DuPont Pessoal, Category Trends,
--            Warning Signs, Monthly History
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_cfa_diagnostics(p_user_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_avg_income   NUMERIC := 0;
  v_avg_expense  NUMERIC := 0;
  v_months_analyzed INT := 0;
  v_liquid       NUMERIC := 0;
  v_illiquid     NUMERIC := 0;
  v_liabilities  NUMERIC := 0;
  v_net_worth    NUMERIC := 0;
  v_total_pat    NUMERIC := 0;
  v_savings_rate NUMERIC := 0;
  v_hhi          NUMERIC := 0;
  v_top_name     TEXT := '';
  v_top_pct      NUMERIC := 0;
  v_wacc         NUMERIC := 0;
  v_debt_count   INT := 0;
  v_curr_liab_30d NUMERIC := 0;
  v_fixed_exp    NUMERIC := 0;
  v_variable_exp NUMERIC := 0;
  v_inc_mean     NUMERIC := 0;
  v_inc_stddev   NUMERIC := 0;
  v_inc_cv       NUMERIC := 0;
  v_inc_months   INT := 0;
  v_sav_margin   NUMERIC := 0;
  v_asset_turn   NUMERIC := 0;
  v_eq_mult      NUMERIC := 0;
  v_cat_trends   JSON;
  v_warnings     JSON;
  v_history      JSON;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- ── SHARED: Income & Expense (6 months) ──
  SELECT
    COALESCE(SUM(CASE WHEN t.type='income' THEN t.amount * get_rate_to_brl(a.currency) END), 0),
    COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount * get_rate_to_brl(a.currency) END), 0),
    GREATEST(COUNT(DISTINCT date_trunc('month', t.date))::INT, 1)
  INTO v_avg_income, v_avg_expense, v_months_analyzed
  FROM transactions t
  JOIN accounts a ON a.id = t.account_id
  WHERE t.user_id = p_user_id AND t.is_deleted = false
    AND t.date >= (CURRENT_DATE - INTERVAL '6 months')
    AND t.type IN ('income','expense');

  v_avg_income  := v_avg_income  / v_months_analyzed;
  v_avg_expense := v_avg_expense / v_months_analyzed;

  -- ── SHARED: Balance sheet ──
  SELECT COALESCE(SUM(current_balance * get_rate_to_brl(currency)), 0)
  INTO v_liquid FROM accounts
  WHERE user_id = p_user_id AND is_active = true
    AND type IN ('checking','savings','cash','investment');

  SELECT COALESCE(SUM(current_value * get_rate_to_brl(currency)), 0)
  INTO v_illiquid FROM assets WHERE user_id = p_user_id;

  SELECT COALESCE(SUM(ABS(current_balance) * get_rate_to_brl(currency)), 0)
  INTO v_liabilities FROM accounts
  WHERE user_id = p_user_id AND is_active = true
    AND type IN ('credit_card','loan','financing');

  v_net_worth := v_liquid + v_illiquid - v_liabilities;
  v_total_pat := v_liquid + v_illiquid;

  -- ════════ CAMADA A ════════

  -- A1: Savings rate
  IF v_avg_income > 0 THEN
    v_savings_rate := ROUND((v_avg_income - v_avg_expense) / v_avg_income * 100, 1);
  END IF;

  -- A2: HHI patrimonial
  WITH items AS (
    SELECT name, current_balance * get_rate_to_brl(currency) AS val
    FROM accounts WHERE user_id = p_user_id AND is_active = true
      AND type IN ('checking','savings','cash','investment') AND current_balance > 0
    UNION ALL
    SELECT name, current_value * get_rate_to_brl(currency) AS val
    FROM assets WHERE user_id = p_user_id AND current_value > 0
  ),
  pcts AS (
    SELECT name, val, val / NULLIF(SUM(val) OVER (), 0) AS w FROM items
  )
  SELECT
    COALESCE(ROUND(SUM(w * w), 4), 0),
    COALESCE((SELECT name FROM pcts ORDER BY w DESC LIMIT 1), ''),
    COALESCE(ROUND((SELECT w * 100 FROM pcts ORDER BY w DESC LIMIT 1), 1), 0)
  INTO v_hhi, v_top_name, v_top_pct FROM pcts;

  -- A3: WACC pessoal
  WITH debts AS (
    SELECT ABS(current_balance) * get_rate_to_brl(currency) AS bal,
      COALESCE(interest_rate, 0) AS rate
    FROM accounts
    WHERE user_id = p_user_id AND is_active = true
      AND type IN ('loan','financing','credit_card') AND ABS(current_balance) > 0
  ),
  agg AS (SELECT SUM(bal) AS total, COUNT(*) AS cnt FROM debts)
  SELECT
    CASE WHEN a.total > 0 THEN ROUND(SUM(d.bal / a.total * d.rate), 2) ELSE 0 END,
    COALESCE(a.cnt, 0)::INT
  INTO v_wacc, v_debt_count
  FROM debts d, agg a GROUP BY a.total, a.cnt;

  v_wacc := COALESCE(v_wacc, 0);
  v_debt_count := COALESCE(v_debt_count, 0);

  -- A5: Working capital (recurrences próximos 30 dias)
  SELECT COALESCE(SUM((r.template_transaction->>'amount')::NUMERIC), 0)
  INTO v_curr_liab_30d FROM recurrences r
  WHERE r.user_id = p_user_id AND r.is_active = true
    AND r.template_transaction->>'type' = 'expense'
    AND r.next_due_date <= CURRENT_DATE + 30;

  -- A6: Breakeven
  SELECT COALESCE(SUM((r.template_transaction->>'amount')::NUMERIC), 0)
  INTO v_fixed_exp FROM recurrences r
  WHERE r.user_id = p_user_id AND r.is_active = true
    AND r.template_transaction->>'type' = 'expense';

  v_variable_exp := GREATEST(v_avg_expense - v_fixed_exp, 0);

  -- ════════ CAMADA B ════════

  -- B1: CV de renda (12 meses)
  WITH monthly_inc AS (
    SELECT date_trunc('month', t.date) AS m,
      SUM(t.amount * get_rate_to_brl(a.currency)) AS total
    FROM transactions t JOIN accounts a ON a.id = t.account_id
    WHERE t.user_id = p_user_id AND t.type = 'income' AND t.is_deleted = false
      AND t.date >= (CURRENT_DATE - INTERVAL '12 months')
    GROUP BY 1
  )
  SELECT COALESCE(AVG(total), 0), COALESCE(STDDEV_POP(total), 0), COUNT(*)::INT
  INTO v_inc_mean, v_inc_stddev, v_inc_months FROM monthly_inc;

  IF v_inc_mean > 0 AND v_inc_months >= 2 THEN
    v_inc_cv := ROUND(v_inc_stddev / v_inc_mean, 3);
  END IF;

  -- B2: DuPont Pessoal
  IF v_avg_income > 0 THEN
    v_sav_margin := ROUND((v_avg_income - v_avg_expense) / v_avg_income, 4);
  END IF;
  IF v_total_pat > 0 THEN
    v_asset_turn := ROUND((v_avg_income * 12) / v_total_pat, 4);
  END IF;
  IF v_net_worth > 0 THEN
    v_eq_mult := ROUND(v_total_pat / v_net_worth, 4);
  END IF;

  -- B3: Category trends (3 meses, top 10)
  WITH cat_m AS (
    SELECT c.id AS cid, c.name AS cname, c.color,
      date_trunc('month', t.date) AS m,
      SUM(t.amount * get_rate_to_brl(a.currency)) AS total
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    JOIN categories c ON c.id = t.category_id
    WHERE t.user_id = p_user_id AND t.type = 'expense' AND t.is_deleted = false
      AND t.date >= date_trunc('month', CURRENT_DATE) - INTERVAL '2 months'
    GROUP BY 1, 2, 3, 4
  ),
  pivoted AS (
    SELECT cid, cname, color,
      SUM(CASE WHEN m = date_trunc('month', CURRENT_DATE) - INTERVAL '2 months' THEN total END) AS m1,
      SUM(CASE WHEN m = date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' THEN total END) AS m2,
      SUM(CASE WHEN m = date_trunc('month', CURRENT_DATE) THEN total END) AS m3
    FROM cat_m GROUP BY 1, 2, 3
    HAVING COUNT(DISTINCT m) >= 2
  )
  SELECT COALESCE(json_agg(sub ORDER BY sub.biggest DESC), '[]'::JSON)
  INTO v_cat_trends
  FROM (
    SELECT cid, cname, color,
      COALESCE(ROUND(m1, 2), 0) AS m1, COALESCE(ROUND(m2, 2), 0) AS m2,
      COALESCE(ROUND(m3, 2), 0) AS m3,
      GREATEST(COALESCE(m3,0), COALESCE(m2,0), COALESCE(m1,0)) AS biggest,
      CASE WHEN COALESCE(m1, 0) > 0
        THEN ROUND((COALESCE(m3, m2) - m1) / m1 * 100, 1) ELSE 0 END AS trend_pct,
      CASE
        WHEN COALESCE(m3, m2, 0) > COALESCE(m1, 0) * 1.05 THEN 'up'
        WHEN COALESCE(m3, m2, 0) < COALESCE(m1, 0) * 0.95 THEN 'down'
        ELSE 'stable' END AS direction
    FROM pivoted LIMIT 10
  ) sub;

  -- B4: Warning signs (snapshots)
  WITH snap_recent AS (
    SELECT burn_rate, runway_months, total_income, total_expense,
      total_balance + total_assets AS nw,
      ROW_NUMBER() OVER (ORDER BY month DESC) AS rn
    FROM monthly_snapshots WHERE user_id = p_user_id
    ORDER BY month DESC LIMIT 4
  ),
  arr AS (
    SELECT
      array_agg(burn_rate ORDER BY rn) AS burns,
      array_agg(nw ORDER BY rn) AS nws,
      array_agg(runway_months ORDER BY rn) AS rws,
      array_agg(CASE WHEN total_expense > total_income THEN 1 ELSE 0 END ORDER BY rn) AS neg,
      COUNT(*) AS cnt
    FROM snap_recent
  )
  SELECT json_build_object(
    'burn_rising', cnt >= 3 AND burns[1] > burns[2] AND burns[2] > burns[3],
    'nw_declining', cnt >= 3 AND nws[1] < nws[2] AND nws[2] < nws[3],
    'runway_shrinking', cnt >= 3 AND rws[1] < rws[2] AND rws[2] < rws[3],
    'savings_negative', COALESCE(neg[1], 0) + COALESCE(neg[2], 0) + COALESCE(neg[3], 0) >= 2,
    'count', (CASE WHEN cnt >= 3 AND burns[1] > burns[2] AND burns[2] > burns[3] THEN 1 ELSE 0 END
      + CASE WHEN cnt >= 3 AND nws[1] < nws[2] AND nws[2] < nws[3] THEN 1 ELSE 0 END
      + CASE WHEN cnt >= 3 AND rws[1] < rws[2] AND rws[2] < rws[3] THEN 1 ELSE 0 END
      + CASE WHEN COALESCE(neg[1],0)+COALESCE(neg[2],0)+COALESCE(neg[3],0) >= 2 THEN 1 ELSE 0 END)
  ) INTO v_warnings FROM arr;

  v_warnings := COALESCE(v_warnings, '{"burn_rising":false,"nw_declining":false,"runway_shrinking":false,"savings_negative":false,"count":0}'::JSON);

  -- B5: Monthly history (12 snapshots)
  SELECT COALESCE(json_agg(sub ORDER BY sub.month), '[]'::JSON)
  INTO v_history
  FROM (
    SELECT month,
      COALESCE(total_income, 0) AS income, COALESCE(total_expense, 0) AS expense,
      CASE WHEN COALESCE(total_income, 0) > 0
        THEN ROUND((total_income - total_expense) / total_income * 100, 1) ELSE 0 END AS savings_rate,
      COALESCE(total_balance + total_assets, 0) AS net_worth,
      COALESCE(burn_rate, 0) AS burn_rate, COALESCE(runway_months, 0) AS runway
    FROM monthly_snapshots WHERE user_id = p_user_id
    ORDER BY month DESC LIMIT 12
  ) sub;

  -- ════════ RETURN ════════
  RETURN json_build_object(
    'savings_rate', json_build_object(
      'value', v_savings_rate, 'monthly_surplus', ROUND(v_avg_income - v_avg_expense, 2),
      'avg_income', ROUND(v_avg_income, 2), 'avg_expense', ROUND(v_avg_expense, 2),
      'months_analyzed', v_months_analyzed),
    'patrimony_hhi', json_build_object(
      'value', v_hhi,
      'concentration', CASE WHEN v_hhi > 0.5 THEN 'critical' WHEN v_hhi > 0.25 THEN 'high'
        WHEN v_hhi > 0.15 THEN 'moderate' ELSE 'diversified' END,
      'top_item', v_top_name, 'top_pct', v_top_pct, 'total_patrimony', ROUND(v_total_pat, 2)),
    'wacc_personal', json_build_object(
      'value', v_wacc, 'debt_count', v_debt_count, 'total_debt', ROUND(v_liabilities, 2)),
    'debt_to_equity', json_build_object(
      'value', CASE WHEN v_net_worth > 0 THEN ROUND(v_liabilities / v_net_worth, 3) ELSE 0 END,
      'total_debt', ROUND(v_liabilities, 2), 'net_worth', ROUND(v_net_worth, 2)),
    'working_capital', json_build_object(
      'value', ROUND(v_liquid - v_curr_liab_30d, 2),
      'current_assets', ROUND(v_liquid, 2), 'current_liabilities_30d', ROUND(v_curr_liab_30d, 2)),
    'breakeven', json_build_object(
      'monthly_value', CASE WHEN v_avg_expense > 0 AND v_variable_exp > 0
        THEN ROUND(v_fixed_exp / (1 - v_variable_exp / v_avg_expense), 2)
        ELSE ROUND(v_fixed_exp, 2) END,
      'fixed_expenses', ROUND(v_fixed_exp, 2), 'variable_expenses', ROUND(v_variable_exp, 2),
      'variable_pct', CASE WHEN v_avg_expense > 0
        THEN ROUND(v_variable_exp / v_avg_expense * 100, 1) ELSE 0 END),
    'income_volatility', json_build_object(
      'cv', v_inc_cv, 'mean', ROUND(v_inc_mean, 2), 'std_dev', ROUND(v_inc_stddev, 2),
      'months_analyzed', v_inc_months,
      'risk_level', CASE WHEN v_inc_cv > 0.5 THEN 'critical' WHEN v_inc_cv > 0.3 THEN 'high'
        WHEN v_inc_cv > 0.15 THEN 'moderate' ELSE 'low' END),
    'dupont_personal', json_build_object(
      'savings_margin', v_sav_margin, 'asset_turnover', v_asset_turn,
      'equity_multiplier', v_eq_mult, 'roe', ROUND(v_sav_margin * v_asset_turn * v_eq_mult, 4)),
    'category_trends', v_cat_trends,
    'warning_signs', v_warnings,
    'monthly_history', v_history
  );
END;
$$;
