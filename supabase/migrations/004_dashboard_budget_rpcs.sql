-- ============================================
-- WealthOS - Migration 004: Dashboard & Budget RPCs
-- ============================================
-- Applied: 2026-03-08 via Supabase MCP
-- Phase 3: DASH-01 to DASH-12, CTB-05, ORC-05
-- 6 RPCs for dashboard + budget aggregations
-- ============================================

-- 1. get_dashboard_summary(p_user_id UUID) → JSON
--    DASH-01: saldo consolidado (atual + previsto)
--    DASH-02: receitas vs despesas do mês
--    Returns: {total_current_balance, total_projected_balance, active_accounts,
--              month_income, month_expense, month_start, month_end}

-- 2. get_balance_sheet(p_user_id UUID) → JSON
--    CTB-05: balanço patrimonial
--    Returns: {liquid_assets, illiquid_assets, total_assets,
--              total_liabilities, net_worth}

-- 3. get_solvency_metrics(p_user_id UUID) → JSON
--    DASH-09: LCR = (T1+T2)/(Burn Rate×6)
--    DASH-10: Runway = (T1+T2)/Burn Rate
--    DASH-11: Burn Rate = média despesas 6 meses
--    DASH-12: Patrimônio por Tiers (T1..T4)
--    Returns: {tier1..4_total, total_patrimony, burn_rate,
--              runway_months, lcr, months_analyzed}

-- 4. get_top_categories(p_user_id, p_year, p_month, p_limit) → JSON
--    DASH-03: top categorias de gasto
--    Returns: {categories: [{category_name, icon, color, total, percentage}],
--              total_expense, month}

-- 5. get_balance_evolution(p_user_id, p_months) → JSON
--    DASH-07: evolução do saldo
--    Returns: {data: [{month, balance, projected, income, expense}],
--              source: 'snapshots'|'calculated', months_requested}

-- 6. get_budget_vs_actual(p_user_id, p_year, p_month) → JSON
--    DASH-05, ORC-05: orçamento planejado vs realizado
--    Returns: {items: [{category_name, planned, actual, remaining,
--              pct_used, status}], total_planned, total_actual,
--              total_remaining, pct_used, month, budget_count}

-- Full SQL applied via Supabase:apply_migration MCP tool.
-- See migration history for complete source.
