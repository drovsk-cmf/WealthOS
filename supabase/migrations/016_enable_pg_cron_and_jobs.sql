-- ============================================
-- WealthOS/Oniefy - Migration 016: pg_cron Jobs
-- ============================================
-- Enable pg_cron and set up scheduled maintenance jobs.
-- Jobs run as database owner (bypass RLS), so we create
-- SECURITY DEFINER wrapper functions for each task.
-- ============================================

-- 1. Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage to postgres role (required for Supabase)
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;


-- ─── 2. Wrapper: Auto-generate workflow tasks (daily) ────────
-- Creates tasks for current month for all users with active workflows.
-- Skips if tasks already exist (idempotent).

CREATE OR REPLACE FUNCTION cron_generate_workflow_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_year INT := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
  v_month INT := EXTRACT(MONTH FROM CURRENT_DATE)::INT;
  v_period_start DATE := make_date(v_year, v_month, 1);
  v_period_end DATE := (v_period_start + interval '1 month')::DATE;
  v_wf RECORD;
  v_created INT := 0;
BEGIN
  -- Iterate all users with active workflows
  FOR v_user IN
    SELECT DISTINCT user_id FROM workflows WHERE is_active = true
  LOOP
    FOR v_wf IN
      SELECT * FROM workflows WHERE user_id = v_user.user_id AND is_active = true
    LOOP
      -- Skip if tasks already exist
      IF EXISTS (
        SELECT 1 FROM workflow_tasks
        WHERE workflow_id = v_wf.id
          AND period_start = v_period_start
          AND period_end = v_period_end
      ) THEN
        CONTINUE;
      END IF;

      -- Generate tasks based on type
      CASE v_wf.workflow_type
        WHEN 'bank_statement', 'card_statement' THEN
          INSERT INTO workflow_tasks (workflow_id, user_id, period_start, period_end, task_type, description)
          VALUES
            (v_wf.id, v_user.user_id, v_period_start, v_period_end, 'upload_document',
             'Upload do extrato/fatura: ' || v_wf.name),
            (v_wf.id, v_user.user_id, v_period_start, v_period_end, 'categorize_transactions',
             'Conferir categorização: ' || v_wf.name);
          v_created := v_created + 2;

        WHEN 'investment_update' THEN
          INSERT INTO workflow_tasks (workflow_id, user_id, period_start, period_end, task_type, description)
          VALUES
            (v_wf.id, v_user.user_id, v_period_start, v_period_end, 'update_balance',
             'Atualizar posição: ' || v_wf.name);
          v_created := v_created + 1;

        WHEN 'loan_payment' THEN
          INSERT INTO workflow_tasks (workflow_id, user_id, period_start, period_end, task_type, description)
          VALUES
            (v_wf.id, v_user.user_id, v_period_start, v_period_end, 'update_balance',
             'Atualizar saldo do financiamento: ' || v_wf.name);
          v_created := v_created + 1;

        WHEN 'fiscal_review' THEN
          INSERT INTO workflow_tasks (workflow_id, user_id, period_start, period_end, task_type, description)
          VALUES
            (v_wf.id, v_user.user_id, v_period_start, v_period_end, 'review_fiscal',
             'Revisão fiscal: ' || v_wf.name);
          v_created := v_created + 1;
      END CASE;
    END LOOP;
  END LOOP;

  RAISE LOG '[Oniefy cron] workflow tasks generated: %', v_created;
END;
$$;


-- ─── 3. Wrapper: Depreciate all assets (monthly) ────────────
-- Applies monthly linear depreciation to all assets with rate > 0.

CREATE OR REPLACE FUNCTION cron_depreciate_assets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_asset RECORD;
  v_depreciation NUMERIC;
  v_new_value NUMERIC;
  v_count INT := 0;
BEGIN
  FOR v_asset IN
    SELECT * FROM assets
    WHERE depreciation_rate > 0 AND current_value > 0
  LOOP
    v_depreciation := ROUND(v_asset.current_value * (v_asset.depreciation_rate / 12.0 / 100.0), 2);
    v_new_value := GREATEST(v_asset.current_value - v_depreciation, 0);

    INSERT INTO asset_value_history (asset_id, user_id, previous_value, new_value, change_reason, change_source)
    VALUES (v_asset.id, v_asset.user_id, v_asset.current_value, v_new_value, 'Depreciação mensal automática (cron)', 'depreciation');

    UPDATE assets SET current_value = v_new_value, updated_at = now() WHERE id = v_asset.id;
    v_count := v_count + 1;
  END LOOP;

  RAISE LOG '[Oniefy cron] assets depreciated: %', v_count;
END;
$$;


-- ─── 4. Wrapper: Balance integrity check (weekly) ───────────
-- Verifies sum(debit) = sum(credit) for all journal entries.
-- Logs any discrepancies. Does NOT auto-fix.

CREATE OR REPLACE FUNCTION cron_balance_integrity_check()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bad RECORD;
  v_count INT := 0;
BEGIN
  FOR v_bad IN
    SELECT je.id, je.user_id, je.description,
           SUM(jl.amount_debit) AS total_debit,
           SUM(jl.amount_credit) AS total_credit,
           ABS(SUM(jl.amount_debit) - SUM(jl.amount_credit)) AS diff
    FROM journal_entries je
    JOIN journal_lines jl ON jl.journal_entry_id = je.id
    GROUP BY je.id, je.user_id, je.description
    HAVING ABS(SUM(jl.amount_debit) - SUM(jl.amount_credit)) > 0.01
  LOOP
    RAISE WARNING '[Oniefy cron] BALANCE ERROR: journal_entry % (user %) has D=% C=% diff=%',
      v_bad.id, v_bad.user_id, v_bad.total_debit, v_bad.total_credit, v_bad.diff;
    v_count := v_count + 1;
  END LOOP;

  IF v_count = 0 THEN
    RAISE LOG '[Oniefy cron] Balance integrity check passed. All entries balanced.';
  ELSE
    RAISE WARNING '[Oniefy cron] Balance integrity check FAILED: % entries unbalanced', v_count;
  END IF;
END;
$$;


-- ─── 5. Schedule the cron jobs ──────────────────────────────

-- Daily at 02:00 UTC: generate workflow tasks
SELECT cron.schedule(
  'generate-workflow-tasks',
  '0 2 * * *',
  'SELECT cron_generate_workflow_tasks()'
);

-- Monthly on 1st at 03:00 UTC: depreciate assets
SELECT cron.schedule(
  'depreciate-assets',
  '0 3 1 * *',
  'SELECT cron_depreciate_assets()'
);

-- Weekly on Sunday at 04:00 UTC: balance integrity check
SELECT cron.schedule(
  'balance-integrity-check',
  '0 4 * * 0',
  'SELECT cron_balance_integrity_check()'
);
