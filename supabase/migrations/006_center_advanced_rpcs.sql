-- ============================================
-- WealthOS - Migration 006: Center Advanced RPCs
-- ============================================
-- Applied: 2026-03-08 via Supabase MCP
-- Phase 5: CEN-03 (rateio), CEN-04 (P&L), CEN-05 (export)
-- ============================================

-- 1. allocate_to_centers(p_user_id, p_transaction_id, p_allocations JSONB) → JSON
--    CEN-03: Rateio percentual. Validates sum=100%, centers belong to user.
--    Inserts into center_allocations. Supports re-allocation (deletes previous).
--    Returns: {status, transaction_id, allocations[]}

-- 2. get_center_pnl(p_user_id, p_center_id, p_date_from?, p_date_to?) → JSON
--    CEN-04: P&L by center. Uses center_allocations joins.
--    Returns: {center_id, center_name, total_income, total_expense,
--              net_result, monthly[{month, income, expense}]}

-- 3. get_center_export(p_user_id, p_center_id) → JSON
--    CEN-05: Full export for client-side CSV/JSON generation.
--    Returns: {center{}, transactions[], exported_at}
