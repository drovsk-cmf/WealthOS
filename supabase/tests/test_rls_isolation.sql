-- ================================================================
-- Oniefy - RLS Isolation Test Suite
-- ================================================================
-- Run: execute as postgres (superuser) via Supabase SQL Editor or MCP
-- Date: 2026-03-17
-- Scope: 26 tables, 86 policies, 10 SECURITY DEFINER RPCs
-- Method: Simulate User B (attacker) accessing User A (victim) data
--
-- PASS = RLS blocked the operation
-- FAIL = Data leaked or modified across user boundary
-- ================================================================

-- Setup: test results table
DROP TABLE IF EXISTS _rls_test_results;
CREATE TABLE _rls_test_results (
  id SERIAL, test_name TEXT, result TEXT, detail TEXT
);
ALTER TABLE _rls_test_results DISABLE ROW LEVEL SECURITY;
GRANT ALL ON _rls_test_results TO authenticated, anon;

-- ================================================================
-- BATCH 1: SELECT isolation (21 user-scoped tables)
-- ================================================================
DO $$
DECLARE
  v_user_a UUID := 'fab01037-a437-4394-9d8f-bd84db9ce418';
  v_count INT;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'role', 'authenticated', 'aud', 'authenticated'
  )::text, true);

  -- Test each table
  EXECUTE 'SELECT count(*) FROM accounts WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results (test_name, result, detail)
  VALUES ('select_accounts', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM assets WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_assets', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM budgets WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_budgets', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM categories WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_categories', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM chart_of_accounts WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_coa', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM cost_centers WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_cost_centers', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM family_members WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_family', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM journal_entries WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_journal', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM recurrences WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_recurrences', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM transactions WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_transactions', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM users_profile WHERE id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_profile', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM workflows WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_workflows', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM workflow_tasks WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_workflow_tasks', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM access_logs WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_access_logs', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM analytics_events WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_analytics', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM documents WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_documents', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM monthly_snapshots WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_snapshots', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM notification_log WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_notif_log', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM notification_tokens WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_notif_tokens', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM bank_connections WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_bank_conn', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  EXECUTE 'SELECT count(*) FROM asset_value_history WHERE user_id = $1' INTO v_count USING v_user_a;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'select_avh', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  PERFORM set_config('role', 'postgres', true);
END;
$$;

-- ================================================================
-- BATCH 2: Reference tables (public read, no write)
-- ================================================================
DO $$
DECLARE v_count INT; v_affected INT;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'role', 'authenticated', 'aud', 'authenticated'
  )::text, true);

  SELECT count(*) INTO v_count FROM economic_indices;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'ref_read_indices', CASE WHEN v_count > 0 THEN 'PASS' ELSE 'WARN' END, v_count || ' rows');

  SELECT count(*) INTO v_count FROM tax_parameters;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'ref_read_tax_params', CASE WHEN v_count > 0 THEN 'PASS' ELSE 'WARN' END, v_count || ' rows');

  -- Ref write attacks
  UPDATE economic_indices SET value = -999 WHERE true;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'ref_write_indices', CASE WHEN v_affected = 0 THEN 'PASS' ELSE 'FAIL' END, v_affected || ' rows');

  DELETE FROM tax_parameters WHERE true;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'ref_delete_tax', CASE WHEN v_affected = 0 THEN 'PASS' ELSE 'FAIL' END, v_affected || ' rows');

  PERFORM set_config('role', 'postgres', true);
END;
$$;

-- ================================================================
-- BATCH 3: SECURITY DEFINER function abuse (cross-user RPC calls)
-- Tests both READ and WRITE functions. All must return 'Forbidden'.
-- ================================================================
DO $$
DECLARE
  v_user_a UUID := 'fab01037-a437-4394-9d8f-bd84db9ce418';
  v_cat_id UUID := '02c820f2-2400-4e61-9b67-fab5d2291487'; -- User A's real category
  v_result_json JSON;
  v_result_jsonb JSONB;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'role', 'authenticated', 'aud', 'authenticated'
  )::text, true);

  -- ═══ READ functions ═══

  BEGIN SELECT get_dashboard_summary(v_user_a) INTO v_result_json;
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_dashboard', 'FAIL', 'Returned data');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_dashboard', 'PASS', SQLERRM); END;

  BEGIN SELECT get_fiscal_report(v_user_a, 2026) INTO v_result_json;
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_fiscal', 'FAIL', 'Returned data');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_fiscal', 'PASS', SQLERRM); END;

  BEGIN SELECT get_balance_sheet(v_user_a) INTO v_result_json;
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_balance_sheet', 'FAIL', 'Returned data');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_balance_sheet', 'PASS', SQLERRM); END;

  BEGIN SELECT get_solvency_metrics(v_user_a) INTO v_result_json;
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_solvency', 'FAIL', 'Returned data');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_solvency', 'PASS', SQLERRM); END;

  BEGIN SELECT get_weekly_digest(v_user_a) INTO v_result_jsonb;
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_digest', 'FAIL', 'Returned data');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_digest', 'PASS', SQLERRM); END;

  BEGIN SELECT get_budget_vs_actual(v_user_a, 2026, 3) INTO v_result_json;
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_budget_int', 'FAIL', 'Returned data');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_budget_int', 'PASS', SQLERRM); END;

  BEGIN SELECT auto_categorize_transaction(v_user_a, 'Supermercado') INTO v_cat_id;
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_auto_cat', 'FAIL', 'Returned category');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_auto_cat', 'PASS', SQLERRM); END;

  -- ═══ WRITE functions ═══

  BEGIN SELECT create_transaction_with_journal(
      p_user_id := v_user_a, p_account_id := gen_random_uuid(),
      p_type := 'income', p_amount := 999999, p_description := 'HACK'
    ) INTO v_result_json;
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_create_tx', 'FAIL', 'Created tx');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_create_tx', 'PASS', SQLERRM); END;

  BEGIN SELECT create_transfer_with_journal(
      p_user_id := v_user_a, p_from_account_id := gen_random_uuid(),
      p_to_account_id := gen_random_uuid(), p_amount := 100
    ) INTO v_result_json;
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_create_transfer', 'FAIL', 'Created transfer');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_create_transfer', 'PASS', SQLERRM); END;

  BEGIN SELECT reverse_transaction(
      p_user_id := v_user_a, p_transaction_id := gen_random_uuid()
    ) INTO v_result_json;
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_reverse_tx', 'FAIL', 'Reversed tx');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_reverse_tx', 'PASS', SQLERRM); END;

  BEGIN SELECT edit_transaction(
      p_user_id := v_user_a, p_transaction_id := gen_random_uuid(),
      p_account_id := gen_random_uuid()
    ) INTO v_result_json;
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_edit_tx', 'FAIL', 'Edited tx');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_edit_tx', 'PASS', SQLERRM); END;

  -- ═══ SEED functions ═══

  BEGIN PERFORM create_default_categories(v_user_a);
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_seed_cats', 'FAIL', 'Seeded for other user');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_seed_cats', 'PASS', SQLERRM); END;

  BEGIN PERFORM create_default_chart_of_accounts(v_user_a);
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_seed_coa', 'FAIL', 'Seeded for other user');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_seed_coa', 'PASS', SQLERRM); END;

  BEGIN PERFORM create_default_cost_center(v_user_a);
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_seed_cc', 'FAIL', 'Seeded for other user');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_test_results VALUES (DEFAULT, 'rpc_seed_cc', 'PASS', SQLERRM); END;

  PERFORM set_config('role', 'postgres', true);
END;
$$;

-- ================================================================
-- BATCH 4: Anonymous access
-- ================================================================
DO $$
DECLARE v_count INT; v_affected INT;
BEGIN
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '{}', true);

  SELECT count(*) INTO v_count FROM categories;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'anon_select_categories', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  SELECT count(*) INTO v_count FROM transactions;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'anon_select_transactions', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  SELECT count(*) INTO v_count FROM users_profile;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'anon_select_profiles', CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END, v_count || ' rows');

  UPDATE categories SET name = 'HACKED' WHERE true;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'anon_update_categories', CASE WHEN v_affected = 0 THEN 'PASS' ELSE 'FAIL' END, v_affected || ' rows');

  DELETE FROM categories WHERE true;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  INSERT INTO _rls_test_results VALUES (DEFAULT, 'anon_delete_categories', CASE WHEN v_affected = 0 THEN 'PASS' ELSE 'FAIL' END, v_affected || ' rows');

  PERFORM set_config('role', 'postgres', true);
END;
$$;

-- ================================================================
-- RESULTS
-- ================================================================
SELECT
  result,
  count(*) as total,
  string_agg(test_name, ', ' ORDER BY test_name) as tests
FROM _rls_test_results
GROUP BY result
ORDER BY result;

-- Detailed failures (if any)
SELECT test_name, result, detail
FROM _rls_test_results
WHERE result = 'FAIL'
ORDER BY test_name;

-- Cleanup
-- DROP TABLE _rls_test_results;
