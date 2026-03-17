-- ================================================================
-- CRITICAL: Add auth.uid() guard to ALL remaining SECURITY DEFINER
-- functions that accept p_user_id but were missing the check.
--
-- PROVEN VULNERABILITIES (before this migration):
-- - User B could create fake transactions in User A's accounts
-- - User B could reverse/delete User A's transactions
-- - User B could read User A's categories
-- - User B could pollute User A's cost centers
--
-- Fix: Dynamic patching via pg_get_functiondef() + regexp_replace
-- Pattern: IF auth.uid() IS NOT NULL AND p_user_id != auth.uid()
-- Preserves cron/trigger context (auth.uid()=NULL).
--
-- Functions patched:
-- 1. create_transaction_with_journal (CRITICAL: write)
-- 2. create_transfer_with_journal (CRITICAL: write)
-- 3. reverse_transaction (CRITICAL: write)
-- 4. undo_import_batch (CRITICAL: write)
-- 5. auto_categorize_transaction (MODERATE: read)
-- 6. create_default_chart_of_accounts (LOW: seed, idempotent)
-- 7. create_default_cost_center (LOW: seed)
-- ================================================================

DO $$
DECLARE
  v_funcnames TEXT[] := ARRAY[
    'create_transaction_with_journal',
    'create_transfer_with_journal',
    'reverse_transaction',
    'undo_import_batch',
    'auto_categorize_transaction',
    'create_default_chart_of_accounts',
    'create_default_cost_center'
  ];
  v_fname TEXT;
  v_oid OID;
  v_def TEXT;
  v_guard TEXT := E'\n  -- Auth guard: prevent cross-user abuse via SECURITY DEFINER\n  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN\n    RAISE EXCEPTION ''Forbidden'';\n  END IF;\n';
  v_patched INT := 0;
BEGIN
  FOREACH v_fname IN ARRAY v_funcnames
  LOOP
    SELECT oid INTO v_oid
    FROM pg_proc
    WHERE proname = v_fname
      AND pronamespace = 'public'::regnamespace
      AND prosecdef = true
      AND pg_get_function_arguments(oid) LIKE '%p_user_id%'
      AND prosrc NOT LIKE '%auth.uid()%'
    LIMIT 1;

    IF v_oid IS NULL THEN
      CONTINUE;
    END IF;

    v_def := pg_get_functiondef(v_oid);
    v_def := regexp_replace(v_def, E'(BEGIN\n)', E'BEGIN\n' || v_guard, 'i');
    EXECUTE v_def;
    v_patched := v_patched + 1;
  END LOOP;
END;
$$;
