-- ============================================================
-- 054: Fix RLS policies
-- Achado 4.1-A: Add WITH CHECK to UPDATE policies missing it
-- Achado 4.1-B: Fix auth.uid() → (select auth.uid()) for O(1)
-- ============================================================

-- === 4.1-A: UPDATE policies missing WITH CHECK ===

-- chart_of_accounts
DROP POLICY IF EXISTS coa_update ON chart_of_accounts;
CREATE POLICY coa_update ON chart_of_accounts FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- cost_centers
DROP POLICY IF EXISTS cc_update ON cost_centers;
CREATE POLICY cc_update ON cost_centers FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- family_members
DROP POLICY IF EXISTS family_members_update ON family_members;
CREATE POLICY family_members_update ON family_members FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- bank_connections
DROP POLICY IF EXISTS "Users can update own bank_connections" ON bank_connections;
CREATE POLICY "Users can update own bank_connections" ON bank_connections FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- workflow_tasks
DROP POLICY IF EXISTS wt_update ON workflow_tasks;
CREATE POLICY wt_update ON workflow_tasks FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- workflows
DROP POLICY IF EXISTS wf_update ON workflows;
CREATE POLICY wf_update ON workflows FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- === 4.1-B: Fix O(n) auth.uid() → O(1) (select auth.uid()) ===

-- access_logs
DROP POLICY IF EXISTS access_logs_insert ON access_logs;
CREATE POLICY access_logs_insert ON access_logs FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS access_logs_select ON access_logs;
CREATE POLICY access_logs_select ON access_logs FOR SELECT
  USING ((select auth.uid()) = user_id);

-- analytics_events
DROP POLICY IF EXISTS "Users can insert own events" ON analytics_events;
CREATE POLICY "Users can insert own events" ON analytics_events FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can read own events" ON analytics_events;
CREATE POLICY "Users can read own events" ON analytics_events FOR SELECT
  USING ((select auth.uid()) = user_id);
