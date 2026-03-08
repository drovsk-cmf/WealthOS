-- ============================================
-- WealthOS - Migration 007: Workflow RPCs
-- ============================================
-- Applied: 2026-03-08 via Supabase MCP
-- Phase 6: WKF-01 to WKF-04
-- ============================================

-- 1. auto_create_workflow_for_account(p_user_id, p_account_id, p_account_type, p_account_name) → JSON
--    WKF-01: Auto-creates workflow when account is created.
--    Checking/savings → bank_statement, credit_card → card_statement,
--    investment → investment_update. Returns: {status, workflow_id, name}

-- 2. generate_tasks_for_period(p_user_id, p_year, p_month) → JSON
--    WKF-01/02: Generates tasks for all active workflows for a given month.
--    Idempotent. Returns: {status, period, tasks_created, workflows_skipped}

-- 3. complete_workflow_task(p_user_id, p_task_id, p_status, p_result_data) → JSON
--    WKF-02/03/04: Marks task completed/skipped with optional result data.
--    Auto-updates workflow.last_completed_at when all period tasks are done.
--    Returns: {status, task_id, new_status, all_period_tasks_done}
