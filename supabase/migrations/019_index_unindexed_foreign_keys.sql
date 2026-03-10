-- ============================================
-- Oniefy - Migration 019: Index unindexed foreign keys
-- ============================================
-- Supabase performance advisory: unindexed_foreign_keys
-- Adds covering indexes for FK columns that lack them.
-- ============================================

CREATE INDEX IF NOT EXISTS idx_accounts_bank_connection_id ON accounts(bank_connection_id) WHERE bank_connection_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_coa_id ON accounts(coa_id) WHERE coa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_coa_id ON assets(coa_id) WHERE coa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_coa_id ON budgets(coa_id) WHERE coa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_budgets_cost_center_id ON budgets(cost_center_id) WHERE cost_center_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coa_parent_id ON chart_of_accounts(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cc_parent_id ON cost_centers(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_je_workflow_task_id ON journal_entries(workflow_task_id) WHERE workflow_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recurrences_coa_id ON recurrences(coa_id) WHERE coa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recurrences_cost_center_id ON recurrences(cost_center_id) WHERE cost_center_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wt_document_id ON workflow_tasks(document_id) WHERE document_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wf_related_account_id ON workflows(related_account_id) WHERE related_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wf_related_coa_id ON workflows(related_coa_id) WHERE related_coa_id IS NOT NULL;
