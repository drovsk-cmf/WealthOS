-- Migration 076: Fix LGPD account deletion - add savings_goals
-- Audit finding DEF-01: savings_goals was missing from cron_process_account_deletions
-- This caused personal financial data to survive account deletion (LGPD violation)

CREATE OR REPLACE FUNCTION public.cron_process_account_deletions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user RECORD;
  v_deleted_count INT := 0;
  v_storage_deleted INT;
BEGIN
  FOR v_user IN
    SELECT id
    FROM users_profile
    WHERE deletion_requested_at IS NOT NULL
      AND deletion_requested_at < now() - interval '7 days'
  LOOP
    BEGIN
      -- === Phase 1: Break self-references ===
      UPDATE journal_entries SET reversed_entry_id = NULL
        WHERE user_id = v_user.id AND reversed_entry_id IS NOT NULL;

      -- === Phase 2: Delete journal tree (CASCADEs to journal_lines -> center_allocations) ===
      DELETE FROM journal_entries WHERE user_id = v_user.id;

      -- === Phase 3: Delete operational data (leaf tables first) ===
      DELETE FROM workflows WHERE user_id = v_user.id;
      DELETE FROM transactions WHERE user_id = v_user.id;

      -- Financial structure
      DELETE FROM budgets WHERE user_id = v_user.id;
      DELETE FROM recurrences WHERE user_id = v_user.id;
      DELETE FROM savings_goals WHERE user_id = v_user.id;  -- FIX: was missing (audit DEF-01)
      DELETE FROM accounts WHERE user_id = v_user.id;
      DELETE FROM bank_connections WHERE user_id = v_user.id;

      -- Assets (asset_value_history CASCADEs)
      DELETE FROM assets WHERE user_id = v_user.id;

      -- Reference data
      DELETE FROM merchant_patterns WHERE user_id = v_user.id;
      DELETE FROM description_aliases WHERE user_id = v_user.id;
      DELETE FROM categories WHERE user_id = v_user.id;
      DELETE FROM chart_of_accounts WHERE user_id = v_user.id;
      DELETE FROM cost_centers WHERE user_id = v_user.id;
      DELETE FROM family_members WHERE user_id = v_user.id;
      DELETE FROM documents WHERE user_id = v_user.id;

      -- Telemetry and auxiliary
      DELETE FROM notification_log WHERE user_id = v_user.id;
      DELETE FROM notification_tokens WHERE user_id = v_user.id;
      DELETE FROM monthly_snapshots WHERE user_id = v_user.id;
      DELETE FROM access_logs WHERE user_id = v_user.id;
      DELETE FROM ai_usage_log WHERE user_id = v_user.id;
      DELETE FROM analytics_events WHERE user_id = v_user.id;
      DELETE FROM user_insights WHERE user_id = v_user.id;
      DELETE FROM setup_journey WHERE user_id = v_user.id;

      -- === Phase 4: Storage objects ===
      DELETE FROM storage.objects
        WHERE bucket_id = 'user-documents'
          AND name LIKE v_user.id::text || '/%';
      GET DIAGNOSTICS v_storage_deleted = ROW_COUNT;

      -- === Phase 5: Profile ===
      DELETE FROM users_profile WHERE id = v_user.id;

      -- === Phase 6: Auth user (Supabase GoTrue) ===
      DELETE FROM auth.users WHERE id = v_user.id;

      v_deleted_count := v_deleted_count + 1;
      RAISE LOG 'cron_process_account_deletions: user % deleted (% storage objects removed)',
        v_user.id, v_storage_deleted;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'cron_process_account_deletions: failed to delete user %: %',
        v_user.id, SQLERRM;
    END;
  END LOOP;

  IF v_deleted_count > 0 THEN
    RAISE LOG 'cron_process_account_deletions: % user(s) deleted', v_deleted_count;
  END IF;
END;
$function$;
