-- Fix WITH CHECK for setup_journey and description_aliases

DROP POLICY IF EXISTS sj_update ON setup_journey;
CREATE POLICY sj_update ON setup_journey FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS da_update ON description_aliases;
CREATE POLICY da_update ON description_aliases FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
