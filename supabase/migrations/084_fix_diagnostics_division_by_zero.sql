-- Migration 084: Fix division by zero in get_financial_diagnostics
--
-- Bug: When a user has expenses but no fixed recurrences (v_fixed_exp = 0),
-- v_variable_exp equals v_avg_expense, making the contribution margin
-- (1 - v_variable_exp / v_avg_expense) = 0, causing division by zero
-- in the breakeven calculation.
--
-- Fix: Pre-compute contribution margin with guard clause.
-- Applied via execute_sql (not apply_migration).

-- The full function was recreated with the fix via execute_sql.
-- See get_financial_diagnostics: v_contribution_margin variable
-- replaces inline (1 - v_variable_exp / v_avg_expense) to guard against zero.

-- Also created backward-compatible alias for old function name
-- (production may still reference get_cfa_diagnostics until next deploy):
CREATE OR REPLACE FUNCTION public.get_cfa_diagnostics(p_user_id uuid)
RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT public.get_financial_diagnostics(p_user_id);
$$;
