-- Migration 076: Remove trademarked names from DB functions
-- Renames: get_jarvis_scan → get_financial_scan
--          get_jarvis_v2 → get_financial_engine_v2
--          get_cfa_diagnostics → get_financial_diagnostics
-- Applied via execute_sql (apply_migration not supported for this project)
DO $$ BEGIN
  -- get_jarvis_scan → get_financial_scan
  EXECUTE (
    SELECT replace(pg_get_functiondef(oid), 'public.get_jarvis_scan', 'public.get_financial_scan')
    FROM pg_proc WHERE proname = 'get_jarvis_scan' AND pronamespace = 'public'::regnamespace
  );
  DROP FUNCTION IF EXISTS public.get_jarvis_scan(uuid);

  -- get_jarvis_v2 → get_financial_engine_v2
  EXECUTE (
    SELECT replace(pg_get_functiondef(oid), 'public.get_jarvis_v2', 'public.get_financial_engine_v2')
    FROM pg_proc WHERE proname = 'get_jarvis_v2' AND pronamespace = 'public'::regnamespace
  );
  DROP FUNCTION IF EXISTS public.get_jarvis_v2(uuid);

  -- get_cfa_diagnostics → get_financial_diagnostics
  EXECUTE (
    SELECT replace(pg_get_functiondef(oid), 'public.get_cfa_diagnostics', 'public.get_financial_diagnostics')
    FROM pg_proc WHERE proname = 'get_cfa_diagnostics' AND pronamespace = 'public'::regnamespace
  );
  DROP FUNCTION IF EXISTS public.get_cfa_diagnostics(uuid);
END $$;
