-- ============================================
-- Oniefy - Migration 018: RLS initplan optimization
-- ============================================
-- Fix: auth.uid() -> (select auth.uid()) in all RLS policies
-- This wraps the function call in a subselect so PostgreSQL
-- evaluates it once per query (initplan) instead of once per row.
-- Ref: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- ============================================

DROP POLICY IF EXISTS "accounts_select" ON accounts;
CREATE POLICY "accounts_select" ON accounts FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "accounts_insert" ON accounts;
CREATE POLICY "accounts_insert" ON accounts FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "accounts_update" ON accounts;
CREATE POLICY "accounts_update" ON accounts FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "accounts_delete" ON accounts;
CREATE POLICY "accounts_delete" ON accounts FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "avh_select" ON asset_value_history;
CREATE POLICY "avh_select" ON asset_value_history FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "avh_insert" ON asset_value_history;
CREATE POLICY "avh_insert" ON asset_value_history FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "avh_update" ON asset_value_history;
CREATE POLICY "avh_update" ON asset_value_history FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "avh_delete" ON asset_value_history;
CREATE POLICY "avh_delete" ON asset_value_history FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "assets_select" ON assets;
CREATE POLICY "assets_select" ON assets FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "assets_insert" ON assets;
CREATE POLICY "assets_insert" ON assets FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "assets_update" ON assets;
CREATE POLICY "assets_update" ON assets FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "assets_delete" ON assets;
CREATE POLICY "assets_delete" ON assets FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own bank_connections" ON bank_connections;
CREATE POLICY "Users can view own bank_connections" ON bank_connections FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own bank_connections" ON bank_connections;
CREATE POLICY "Users can insert own bank_connections" ON bank_connections FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own bank_connections" ON bank_connections;
CREATE POLICY "Users can update own bank_connections" ON bank_connections FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own bank_connections" ON bank_connections;
CREATE POLICY "Users can delete own bank_connections" ON bank_connections FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "budgets_select" ON budgets;
CREATE POLICY "budgets_select" ON budgets FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "budgets_insert" ON budgets;
CREATE POLICY "budgets_insert" ON budgets FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "budgets_update" ON budgets;
CREATE POLICY "budgets_update" ON budgets FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "budgets_delete" ON budgets;
CREATE POLICY "budgets_delete" ON budgets FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "categories_select" ON categories;
CREATE POLICY "categories_select" ON categories FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "categories_insert" ON categories;
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "categories_update" ON categories;
CREATE POLICY "categories_update" ON categories FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "categories_delete" ON categories;
CREATE POLICY "categories_delete" ON categories FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "ca_select" ON center_allocations;
CREATE POLICY "ca_select" ON center_allocations FOR SELECT USING (EXISTS (SELECT 1 FROM journal_lines jl JOIN journal_entries je ON je.id = jl.journal_entry_id WHERE jl.id = center_allocations.journal_line_id AND je.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "ca_insert" ON center_allocations;
CREATE POLICY "ca_insert" ON center_allocations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM journal_lines jl JOIN journal_entries je ON je.id = jl.journal_entry_id WHERE jl.id = center_allocations.journal_line_id AND je.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "coa_select" ON chart_of_accounts;
CREATE POLICY "coa_select" ON chart_of_accounts FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "coa_insert" ON chart_of_accounts;
CREATE POLICY "coa_insert" ON chart_of_accounts FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "coa_update" ON chart_of_accounts;
CREATE POLICY "coa_update" ON chart_of_accounts FOR UPDATE USING ((select auth.uid()) = user_id AND NOT is_system);

DROP POLICY IF EXISTS "coa_delete" ON chart_of_accounts;
CREATE POLICY "coa_delete" ON chart_of_accounts FOR DELETE USING ((select auth.uid()) = user_id AND NOT is_system);

DROP POLICY IF EXISTS "cc_select" ON cost_centers;
CREATE POLICY "cc_select" ON cost_centers FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "cc_insert" ON cost_centers;
CREATE POLICY "cc_insert" ON cost_centers FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "cc_update" ON cost_centers;
CREATE POLICY "cc_update" ON cost_centers FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "cc_delete" ON cost_centers;
CREATE POLICY "cc_delete" ON cost_centers FOR DELETE USING ((select auth.uid()) = user_id AND NOT is_default);

DROP POLICY IF EXISTS "documents_select" ON documents;
CREATE POLICY "documents_select" ON documents FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "documents_insert" ON documents;
CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "documents_update" ON documents;
CREATE POLICY "documents_update" ON documents FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "documents_delete" ON documents;
CREATE POLICY "documents_delete" ON documents FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "je_select" ON journal_entries;
CREATE POLICY "je_select" ON journal_entries FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "je_insert" ON journal_entries;
CREATE POLICY "je_insert" ON journal_entries FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "jl_select" ON journal_lines;
CREATE POLICY "jl_select" ON journal_lines FOR SELECT USING (EXISTS (SELECT 1 FROM journal_entries WHERE journal_entries.id = journal_lines.journal_entry_id AND journal_entries.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "jl_insert" ON journal_lines;
CREATE POLICY "jl_insert" ON journal_lines FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM journal_entries WHERE journal_entries.id = journal_lines.journal_entry_id AND journal_entries.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "snapshots_select" ON monthly_snapshots;
CREATE POLICY "snapshots_select" ON monthly_snapshots FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "snapshots_insert" ON monthly_snapshots;
CREATE POLICY "snapshots_insert" ON monthly_snapshots FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "snapshots_update" ON monthly_snapshots;
CREATE POLICY "snapshots_update" ON monthly_snapshots FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "snapshots_delete" ON monthly_snapshots;
CREATE POLICY "snapshots_delete" ON monthly_snapshots FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notif_log_select" ON notification_log;
CREATE POLICY "notif_log_select" ON notification_log FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notif_log_insert" ON notification_log;
CREATE POLICY "notif_log_insert" ON notification_log FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notif_log_update" ON notification_log;
CREATE POLICY "notif_log_update" ON notification_log FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notif_log_delete" ON notification_log;
CREATE POLICY "notif_log_delete" ON notification_log FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notif_tokens_select" ON notification_tokens;
CREATE POLICY "notif_tokens_select" ON notification_tokens FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notif_tokens_insert" ON notification_tokens;
CREATE POLICY "notif_tokens_insert" ON notification_tokens FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notif_tokens_update" ON notification_tokens;
CREATE POLICY "notif_tokens_update" ON notification_tokens FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notif_tokens_delete" ON notification_tokens;
CREATE POLICY "notif_tokens_delete" ON notification_tokens FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "recurrences_select" ON recurrences;
CREATE POLICY "recurrences_select" ON recurrences FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "recurrences_insert" ON recurrences;
CREATE POLICY "recurrences_insert" ON recurrences FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "recurrences_update" ON recurrences;
CREATE POLICY "recurrences_update" ON recurrences FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "recurrences_delete" ON recurrences;
CREATE POLICY "recurrences_delete" ON recurrences FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "tax_records_select" ON tax_records;
CREATE POLICY "tax_records_select" ON tax_records FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "tax_records_insert" ON tax_records;
CREATE POLICY "tax_records_insert" ON tax_records FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "tax_records_update" ON tax_records;
CREATE POLICY "tax_records_update" ON tax_records FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "tax_records_delete" ON tax_records;
CREATE POLICY "tax_records_delete" ON tax_records FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "transactions_select" ON transactions;
CREATE POLICY "transactions_select" ON transactions FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "transactions_insert" ON transactions;
CREATE POLICY "transactions_insert" ON transactions FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "transactions_update" ON transactions;
CREATE POLICY "transactions_update" ON transactions FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "transactions_delete" ON transactions;
CREATE POLICY "transactions_delete" ON transactions FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "users_profile_select" ON users_profile;
CREATE POLICY "users_profile_select" ON users_profile FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "users_profile_insert" ON users_profile;
CREATE POLICY "users_profile_insert" ON users_profile FOR INSERT WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "users_profile_update" ON users_profile;
CREATE POLICY "users_profile_update" ON users_profile FOR UPDATE USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "users_profile_delete" ON users_profile;
CREATE POLICY "users_profile_delete" ON users_profile FOR DELETE USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "wt_select" ON workflow_tasks;
CREATE POLICY "wt_select" ON workflow_tasks FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "wt_insert" ON workflow_tasks;
CREATE POLICY "wt_insert" ON workflow_tasks FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "wt_update" ON workflow_tasks;
CREATE POLICY "wt_update" ON workflow_tasks FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "wf_select" ON workflows;
CREATE POLICY "wf_select" ON workflows FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "wf_insert" ON workflows;
CREATE POLICY "wf_insert" ON workflows FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "wf_update" ON workflows;
CREATE POLICY "wf_update" ON workflows FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "wf_delete" ON workflows;
CREATE POLICY "wf_delete" ON workflows FOR DELETE USING ((select auth.uid()) = user_id);
