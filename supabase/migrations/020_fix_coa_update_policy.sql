-- Fix: allow UPDATE on all chart_of_accounts rows owned by user,
-- including is_system=true (seed accounts). The is_system flag
-- protects against DELETE only, not against toggling is_active.
DROP POLICY IF EXISTS coa_update ON chart_of_accounts;

CREATE POLICY coa_update ON chart_of_accounts
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);
