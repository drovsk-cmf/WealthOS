-- DT-015: soft-delete cleanup (90 dias) + DT-014: COA FK constraint
-- Applied to oniefy-prod as 'dt015_soft_delete_cleanup'

CREATE OR REPLACE FUNCTION public.cron_cleanup_soft_deleted()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_deleted INT;
BEGIN
  DELETE FROM transactions WHERE is_deleted = true AND updated_at < now() - interval '90 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted > 0 THEN RAISE LOG 'cron_cleanup_soft_deleted: removed % transactions', v_deleted; END IF;
END; $$;

SELECT cron.schedule('weekly-cleanup-soft-deleted', '30 5 * * 0', 'SELECT cron_cleanup_soft_deleted()');

-- DT-014: FK constraint on chart_of_accounts.parent_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='chart_of_accounts_parent_id_fkey' AND table_name='chart_of_accounts') THEN
    ALTER TABLE chart_of_accounts ADD CONSTRAINT chart_of_accounts_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES chart_of_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;
