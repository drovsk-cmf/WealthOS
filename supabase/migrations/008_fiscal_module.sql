-- ============================================
-- WealthOS - Migration 008: Fiscal Module
-- ============================================
-- Phase 7: FIS-01 to FIS-06 + Tax Provisioning Intelligence
-- Seeds tax_parameters for 2025 and 2026
-- ============================================

-- ─── 1. Seed tax_parameters ──────────────────────────────────

-- IRPF Monthly Progressive Table 2025 (used for declaration 2026)
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'irpf_monthly',
  '2025-05-01',
  '2025-12-31',
  '[
    {"min": 0,       "max": 2428.80,  "rate": 0,    "deduction": 0},
    {"min": 2428.81, "max": 2826.65,  "rate": 7.5,  "deduction": 182.16},
    {"min": 2826.66, "max": 3751.05,  "rate": 15,   "deduction": 394.16},
    {"min": 3751.06, "max": 4664.68,  "rate": 22.5, "deduction": 675.49},
    {"min": 4664.69, "max": 99999999, "rate": 27.5, "deduction": 908.73}
  ]'::JSONB,
  '{"simplified_discount_monthly": 607.20, "dependent_deduction_monthly": 189.59}'::JSONB,
  '[{"source": "RFB", "url": "https://www.gov.br/receitafederal", "date": "2025-05-01"}]'::JSONB,
  'system_seed'
);

-- IRPF Monthly Progressive Table 2026 (same base table, with new reductions)
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'irpf_monthly',
  '2026-01-01',
  NULL,
  '[
    {"min": 0,       "max": 2428.80,  "rate": 0,    "deduction": 0},
    {"min": 2428.81, "max": 2826.65,  "rate": 7.5,  "deduction": 182.16},
    {"min": 2826.66, "max": 3751.05,  "rate": 15,   "deduction": 394.16},
    {"min": 3751.06, "max": 4664.68,  "rate": 22.5, "deduction": 675.49},
    {"min": 4664.69, "max": 99999999, "rate": 27.5, "deduction": 908.73}
  ]'::JSONB,
  '{
    "simplified_discount_monthly": 607.20,
    "dependent_deduction_monthly": 189.59,
    "reduction_flat": 312.89,
    "reduction_formula_constant": 978.62,
    "reduction_formula_factor": 0.133145,
    "reduction_threshold_full": 5000,
    "reduction_threshold_partial": 7350,
    "annual_exemption": 60000,
    "annual_simplified_discount": 17640,
    "education_deduction_annual_per_person": 3561.50
  }'::JSONB,
  '[
    {"source": "RFB", "url": "https://www.gov.br/receitafederal", "date": "2025-12-11"},
    {"source": "Lei 15.270/2025", "url": "https://www.planalto.gov.br", "date": "2025-11-26"}
  ]'::JSONB,
  'system_seed'
);

-- IRPF Annual Table 2025 (for declaration 2026, year-calendar 2025)
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'irpf_annual',
  '2025-01-01',
  '2025-12-31',
  '[
    {"min": 0,        "max": 26963.20,  "rate": 0,    "deduction": 0},
    {"min": 26963.21, "max": 33919.80,  "rate": 7.5,  "deduction": 2022.24},
    {"min": 33919.81, "max": 45012.60,  "rate": 15,   "deduction": 4566.23},
    {"min": 45012.61, "max": 55976.16,  "rate": 22.5, "deduction": 7942.17},
    {"min": 55976.17, "max": 99999999,  "rate": 27.5, "deduction": 10740.98}
  ]'::JSONB,
  '{"simplified_discount_annual": 16754.34}'::JSONB,
  '[{"source": "RFB", "url": "https://www.gov.br/receitafederal", "date": "2025-01-01"}]'::JSONB,
  'system_seed'
);

-- IRPF Annual Table 2026 (for declaration 2027, year-calendar 2026)
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'irpf_annual',
  '2026-01-01',
  NULL,
  '[
    {"min": 0,        "max": 29145.60,  "rate": 0,    "deduction": 0},
    {"min": 29145.61, "max": 33919.80,  "rate": 7.5,  "deduction": 2185.92},
    {"min": 33919.81, "max": 45012.60,  "rate": 15,   "deduction": 4731.41},
    {"min": 45012.61, "max": 55976.16,  "rate": 22.5, "deduction": 8107.35},
    {"min": 55976.17, "max": 99999999,  "rate": 27.5, "deduction": 10906.16}
  ]'::JSONB,
  '{
    "annual_exemption": 60000,
    "simplified_discount_annual": 17640,
    "annual_reduction_flat": 3754.68,
    "annual_reduction_formula_constant": 11743.44,
    "annual_reduction_formula_factor": 0.133145,
    "annual_reduction_threshold_full": 60000,
    "annual_reduction_threshold_partial": 88200
  }'::JSONB,
  '[
    {"source": "RFB", "url": "https://www.gov.br/receitafederal", "date": "2025-12-11"},
    {"source": "Lei 15.270/2025", "url": "https://www.planalto.gov.br", "date": "2025-11-26"}
  ]'::JSONB,
  'system_seed'
);

-- INSS Employee Table 2025
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'inss_employee',
  '2025-01-01',
  '2025-12-31',
  '[
    {"min": 0,       "max": 1518.00,  "rate": 7.5},
    {"min": 1518.01, "max": 2793.88,  "rate": 9},
    {"min": 2793.89, "max": 4190.83,  "rate": 12},
    {"min": 4190.84, "max": 8157.41,  "rate": 14}
  ]'::JSONB,
  '{"ceiling": 8157.41}'::JSONB,
  '[{"source": "Portaria MPS/MF", "url": "https://www.in.gov.br", "date": "2025-01-01"}]'::JSONB,
  'system_seed'
);

-- Minimum Wage 2025
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'minimum_wage',
  '2025-01-01',
  '2025-12-31',
  '[]'::JSONB,
  '{"value": 1518.00}'::JSONB,
  '[{"source": "Decreto Presidencial", "url": "https://www.planalto.gov.br", "date": "2025-01-01"}]'::JSONB,
  'system_seed'
);

-- Capital Gains Table
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'capital_gains',
  '2016-01-01',
  NULL,
  '[
    {"min": 0,         "max": 5000000,   "rate": 15},
    {"min": 5000001,   "max": 10000000,  "rate": 17.5},
    {"min": 10000001,  "max": 30000000,  "rate": 20},
    {"min": 30000001,  "max": 99999999999, "rate": 22.5}
  ]'::JSONB,
  '{"stock_monthly_exemption": 20000, "crypto_monthly_exemption": 35000}'::JSONB,
  '[{"source": "Lei 13.259/2016", "url": "https://www.planalto.gov.br", "date": "2016-03-16"}]'::JSONB,
  'system_seed'
);


-- ─── 2. get_fiscal_report ────────────────────────────────────
-- FIS-01 to FIS-04, FIS-06: Fiscal report by tax_treatment
-- Groups all journal_entries by tax_treatment for a given year.

CREATE OR REPLACE FUNCTION get_fiscal_report(
  p_user_id UUID,
  p_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year_start DATE;
  v_year_end DATE;
  v_result JSON;
  v_by_treatment JSON;
  v_totals JSON;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  v_year_start := make_date(p_year, 1, 1);
  v_year_end := make_date(p_year + 1, 1, 1);

  -- Group by tax_treatment
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::JSON) INTO v_by_treatment
  FROM (
    SELECT
      coa.tax_treatment,
      coa.group_type,
      SUM(CASE WHEN coa.group_type = 'revenue' THEN jl.amount_credit ELSE 0 END) AS total_revenue,
      SUM(CASE WHEN coa.group_type = 'expense' THEN jl.amount_debit ELSE 0 END) AS total_expense,
      COUNT(DISTINCT je.id)::INT AS entry_count,
      json_agg(DISTINCT jsonb_build_object(
        'coa_code', coa.internal_code,
        'coa_name', coa.display_name,
        'total', CASE
          WHEN coa.group_type = 'revenue' THEN jl.amount_credit
          WHEN coa.group_type = 'expense' THEN jl.amount_debit
          ELSE 0
        END
      )) AS accounts
    FROM journal_lines jl
    JOIN chart_of_accounts coa ON coa.id = jl.account_id
    JOIN journal_entries je ON je.id = jl.journal_entry_id
    JOIN transactions tx ON tx.journal_entry_id = je.id
    WHERE tx.user_id = p_user_id
      AND tx.date >= v_year_start AND tx.date < v_year_end
      AND tx.is_deleted = false
      AND je.is_reversal = false
      AND coa.tax_treatment IS NOT NULL
      AND coa.group_type IN ('revenue', 'expense')
    GROUP BY coa.tax_treatment, coa.group_type
    ORDER BY coa.tax_treatment, coa.group_type
  ) t;

  -- Totals
  SELECT json_build_object(
    'total_tributavel_revenue', COALESCE((
      SELECT SUM(jl.amount_credit)
      FROM journal_lines jl
      JOIN chart_of_accounts coa ON coa.id = jl.account_id
      JOIN journal_entries je ON je.id = jl.journal_entry_id
      JOIN transactions tx ON tx.journal_entry_id = je.id
      WHERE tx.user_id = p_user_id AND tx.date >= v_year_start AND tx.date < v_year_end
        AND tx.is_deleted = false AND je.is_reversal = false
        AND coa.tax_treatment = 'tributavel' AND coa.group_type = 'revenue'
    ), 0),
    'total_isento_revenue', COALESCE((
      SELECT SUM(jl.amount_credit)
      FROM journal_lines jl
      JOIN chart_of_accounts coa ON coa.id = jl.account_id
      JOIN journal_entries je ON je.id = jl.journal_entry_id
      JOIN transactions tx ON tx.journal_entry_id = je.id
      WHERE tx.user_id = p_user_id AND tx.date >= v_year_start AND tx.date < v_year_end
        AND tx.is_deleted = false AND je.is_reversal = false
        AND coa.tax_treatment = 'isento' AND coa.group_type = 'revenue'
    ), 0),
    'total_dedutivel_expense', COALESCE((
      SELECT SUM(jl.amount_debit)
      FROM journal_lines jl
      JOIN chart_of_accounts coa ON coa.id = jl.account_id
      JOIN journal_entries je ON je.id = jl.journal_entry_id
      JOIN transactions tx ON tx.journal_entry_id = je.id
      WHERE tx.user_id = p_user_id AND tx.date >= v_year_start AND tx.date < v_year_end
        AND tx.is_deleted = false AND je.is_reversal = false
        AND coa.tax_treatment IN ('dedutivel_integral', 'dedutivel_limitado')
        AND coa.group_type = 'expense'
    ), 0),
    'total_transactions', COALESCE((
      SELECT COUNT(*)::INT FROM transactions
      WHERE user_id = p_user_id AND date >= v_year_start AND date < v_year_end AND is_deleted = false
    ), 0)
  ) INTO v_totals;

  RETURN json_build_object(
    'year', p_year,
    'period_start', v_year_start,
    'period_end', v_year_end,
    'by_treatment', v_by_treatment,
    'totals', v_totals
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_fiscal_report(UUID, INT) TO authenticated;


-- ─── 3. get_fiscal_projection ────────────────────────────────
-- TAX PROVISIONING INTELLIGENCE
-- Calculates projected annual IRPF based on YTD income,
-- compares against IRRF withheld, shows monthly gap to provision.
-- This is the "multiple sources" scenario intelligence.

CREATE OR REPLACE FUNCTION get_fiscal_projection(
  p_user_id UUID,
  p_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year_start DATE;
  v_today DATE := CURRENT_DATE;
  v_months_elapsed INT;
  v_months_remaining INT;
  v_ytd_taxable_income NUMERIC := 0;
  v_ytd_deductible NUMERIC := 0;
  v_ytd_irrf_withheld NUMERIC := 0;
  v_projected_annual_income NUMERIC := 0;
  v_projected_annual_deductible NUMERIC := 0;
  v_taxable_base NUMERIC := 0;
  v_estimated_annual_tax NUMERIC := 0;
  v_tax_gap NUMERIC := 0;
  v_monthly_provision NUMERIC := 0;
  v_brackets JSONB;
  v_limits JSONB;
  v_bracket JSONB;
  v_annual_reduction NUMERIC := 0;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  v_year_start := make_date(p_year, 1, 1);
  v_months_elapsed := GREATEST(EXTRACT(MONTH FROM v_today)::INT - EXTRACT(MONTH FROM v_year_start)::INT + 1, 1);
  v_months_remaining := 12 - v_months_elapsed;

  -- YTD taxable income (tax_treatment = 'tributavel')
  SELECT COALESCE(SUM(tx.amount), 0) INTO v_ytd_taxable_income
  FROM transactions tx
  JOIN journal_entries je ON je.id = tx.journal_entry_id
  JOIN journal_lines jl ON jl.journal_entry_id = je.id
  JOIN chart_of_accounts coa ON coa.id = jl.account_id
  WHERE tx.user_id = p_user_id
    AND tx.type = 'income'
    AND tx.date >= v_year_start AND tx.date < v_today + 1
    AND tx.is_deleted = false
    AND coa.tax_treatment = 'tributavel'
    AND coa.group_type = 'revenue';

  -- YTD deductible expenses
  SELECT COALESCE(SUM(tx.amount), 0) INTO v_ytd_deductible
  FROM transactions tx
  JOIN journal_entries je ON je.id = tx.journal_entry_id
  JOIN journal_lines jl ON jl.journal_entry_id = je.id
  JOIN chart_of_accounts coa ON coa.id = jl.account_id
  WHERE tx.user_id = p_user_id
    AND tx.type = 'expense'
    AND tx.date >= v_year_start AND tx.date < v_today + 1
    AND tx.is_deleted = false
    AND coa.tax_treatment IN ('dedutivel_integral', 'dedutivel_limitado')
    AND coa.group_type = 'expense';

  -- Project to 12 months
  v_projected_annual_income := ROUND(v_ytd_taxable_income * 12.0 / v_months_elapsed, 2);
  v_projected_annual_deductible := ROUND(v_ytd_deductible * 12.0 / v_months_elapsed, 2);

  -- Taxable base = income - deductions (simplified: max of actual deductions vs simplified discount)
  -- Fetch annual table for the year
  SELECT brackets, limits INTO v_brackets, v_limits
  FROM tax_parameters
  WHERE parameter_type = 'irpf_annual'
    AND valid_from <= make_date(p_year, 12, 31)
    AND (valid_until IS NULL OR valid_until >= make_date(p_year, 1, 1))
  ORDER BY valid_from DESC
  LIMIT 1;

  -- If no table found, return empty projection
  IF v_brackets IS NULL THEN
    RETURN json_build_object(
      'status', 'no_parameters',
      'message', 'Tabela IRPF não encontrada para o ano ' || p_year
    );
  END IF;

  -- Calculate taxable base (use simplified discount if higher than actual deductions)
  DECLARE
    v_simplified_discount NUMERIC := COALESCE((v_limits->>'simplified_discount_annual')::NUMERIC, 0);
    v_annual_exemption NUMERIC := COALESCE((v_limits->>'annual_exemption')::NUMERIC, 0);
  BEGIN
    v_taxable_base := v_projected_annual_income - GREATEST(v_projected_annual_deductible, v_simplified_discount);
    v_taxable_base := GREATEST(v_taxable_base, 0);

    -- Check annual exemption (2026: R$60k)
    IF v_projected_annual_income <= v_annual_exemption AND v_annual_exemption > 0 THEN
      v_estimated_annual_tax := 0;
    ELSE
      -- Apply progressive brackets
      FOR v_bracket IN SELECT * FROM jsonb_array_elements(v_brackets)
      LOOP
        IF v_taxable_base >= (v_bracket->>'min')::NUMERIC AND v_taxable_base <= (v_bracket->>'max')::NUMERIC THEN
          v_estimated_annual_tax := ROUND(
            v_taxable_base * (v_bracket->>'rate')::NUMERIC / 100.0 - (v_bracket->>'deduction')::NUMERIC,
            2
          );
          EXIT;
        END IF;
      END LOOP;

      -- Apply annual reduction if applicable (2026 Lei 15.270)
      IF v_limits ? 'annual_reduction_flat' THEN
        DECLARE
          v_reduction_flat NUMERIC := (v_limits->>'annual_reduction_flat')::NUMERIC;
          v_reduction_threshold_full NUMERIC := (v_limits->>'annual_reduction_threshold_full')::NUMERIC;
          v_reduction_threshold_partial NUMERIC := (v_limits->>'annual_reduction_threshold_partial')::NUMERIC;
          v_reduction_constant NUMERIC := (v_limits->>'annual_reduction_formula_constant')::NUMERIC;
          v_reduction_factor NUMERIC := (v_limits->>'annual_reduction_formula_factor')::NUMERIC;
        BEGIN
          IF v_projected_annual_income <= v_reduction_threshold_full THEN
            v_annual_reduction := LEAST(v_reduction_flat, v_estimated_annual_tax);
          ELSIF v_projected_annual_income <= v_reduction_threshold_partial THEN
            v_annual_reduction := LEAST(
              v_reduction_constant - v_reduction_factor * v_projected_annual_income,
              v_estimated_annual_tax
            );
            v_annual_reduction := GREATEST(v_annual_reduction, 0);
          END IF;
        END;
      END IF;

      v_estimated_annual_tax := GREATEST(v_estimated_annual_tax - v_annual_reduction, 0);
    END IF;
  END;

  -- YTD IRRF withheld (from transactions tagged as irrf - stored in notes or tags)
  -- For now, approximate as 0 since we don't have a dedicated IRRF field yet.
  -- The user will input IRRF manually via the fiscal module.
  v_ytd_irrf_withheld := 0;

  -- Tax gap
  v_tax_gap := v_estimated_annual_tax - v_ytd_irrf_withheld;

  -- Monthly provision
  IF v_months_remaining > 0 THEN
    v_monthly_provision := ROUND(v_tax_gap / v_months_remaining, 2);
  ELSE
    v_monthly_provision := v_tax_gap;
  END IF;

  RETURN json_build_object(
    'year', p_year,
    'months_elapsed', v_months_elapsed,
    'months_remaining', v_months_remaining,
    'ytd_taxable_income', v_ytd_taxable_income,
    'ytd_deductible_expenses', v_ytd_deductible,
    'projected_annual_income', v_projected_annual_income,
    'projected_annual_deductible', v_projected_annual_deductible,
    'taxable_base', v_taxable_base,
    'estimated_annual_tax', v_estimated_annual_tax,
    'annual_reduction_applied', v_annual_reduction,
    'ytd_irrf_withheld', v_ytd_irrf_withheld,
    'tax_gap', v_tax_gap,
    'monthly_provision', v_monthly_provision,
    'disclaimer', 'Projeção estimativa. Não substitui consultoria tributária profissional.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_fiscal_projection(UUID, INT) TO authenticated;
