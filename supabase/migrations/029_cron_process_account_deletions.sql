-- Migration 029: pg_cron job for processing account deletions (CFG-06)
-- Runs daily at 03:30 UTC. Processes users where deletion_requested_at + 7 days < now().

CREATE OR REPLACE FUNCTION cron_process_account_deletions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_deleted_count INT := 0;
BEGIN
  FOR v_user IN
    SELECT id FROM users_profile
    WHERE deletion_requested_at IS NOT NULL
      AND deletion_requested_at + interval '7 days' < now()
  LOOP
    -- Delete in order respecting FK constraints (children first)
    DELETE FROM center_allocations WHERE journal_line_id IN (
      SELECT id FROM journal_lines WHERE journal_entry_id IN (
        SELECT id FROM journal_entries WHERE user_id = v_user.id
      )
    );
    DELETE FROM journal_lines WHERE journal_entry_id IN (
      SELECT id FROM journal_entries WHERE user_id = v_user.id
    );
    DELETE FROM journal_entries WHERE user_id = v_user.id;
    DELETE FROM workflow_tasks WHERE user_id = v_user.id;
    DELETE FROM workflows WHERE user_id = v_user.id;
    DELETE FROM transactions WHERE user_id = v_user.id;
    DELETE FROM budgets WHERE user_id = v_user.id;
    DELETE FROM recurrences WHERE user_id = v_user.id;
    DELETE FROM asset_value_history WHERE user_id = v_user.id;
    DELETE FROM assets WHERE user_id = v_user.id;
    DELETE FROM documents WHERE user_id = v_user.id;
    DELETE FROM notification_log WHERE user_id = v_user.id;
    DELETE FROM notification_tokens WHERE user_id = v_user.id;
    DELETE FROM family_members WHERE user_id = v_user.id;
    DELETE FROM cost_centers WHERE user_id = v_user.id;
    DELETE FROM chart_of_accounts WHERE user_id = v_user.id;
    DELETE FROM categories WHERE user_id = v_user.id;
    DELETE FROM accounts WHERE user_id = v_user.id;
    DELETE FROM bank_connections WHERE user_id = v_user.id;
    DELETE FROM tax_parameters WHERE updated_by = v_user.id::text;
    DELETE FROM monthly_snapshots WHERE user_id = v_user.id;

    -- Mark profile as purged (keep record for audit, remove PII)
    UPDATE users_profile
    SET full_name = '[excluído]',
        cpf_encrypted = NULL,
        encryption_key_encrypted = NULL,
        encryption_key_iv = NULL,
        kek_material = NULL,
        onboarding_completed = false,
        updated_at = now()
    WHERE id = v_user.id;

    v_deleted_count := v_deleted_count + 1;
  END LOOP;

  IF v_deleted_count > 0 THEN
    RAISE NOTICE 'Processed % account deletion(s)', v_deleted_count;
  END IF;
END;
$$;

SELECT cron.schedule(
  'process-account-deletions',
  '30 3 * * *',
  $$SELECT cron_process_account_deletions()$$
);
