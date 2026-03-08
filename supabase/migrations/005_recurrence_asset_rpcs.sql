-- ============================================
-- WealthOS - Migration 005: Recurrence & Asset RPCs
-- ============================================
-- Applied: 2026-03-08 via Supabase MCP
-- Phase 4: CAP-01 to CAP-06, PAT-01 to PAT-07
-- ============================================

-- 1. generate_next_recurrence(p_user_id, p_recurrence_id) → JSON
--    CAP-05: Advances next_due_date, creates next pending transaction,
--    applies manual adjustment_rate if configured.
--    Returns: {status, recurrence_id, transaction_id, next_due_date, amount}

-- 2. depreciate_asset(p_user_id, p_asset_id) → JSON
--    PAT-05: Monthly linear depreciation = current_value * (rate/12/100).
--    Records in asset_value_history, updates current_value. Floor at zero.
--    Returns: {status, asset_id, previous_value, depreciation, new_value}

-- 3. get_assets_summary(p_user_id) → JSON
--    PAT-04 + PAT-06: Totals by category + insurance expiry alerts (30d).
--    Returns: {total_value, total_acquisition, asset_count, by_category,
--              expiring_insurance, total_depreciation}

-- Full SQL applied via Supabase:apply_migration MCP tool.
