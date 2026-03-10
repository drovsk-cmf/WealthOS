-- ============================================
-- Oniefy - Migration 017: Fix search_path on legacy functions
-- ============================================
-- Supabase security advisory: function_search_path_mutable
-- Using ALTER FUNCTION to add SET search_path without redefining body.
-- ============================================

-- Trigger functions (no args)
ALTER FUNCTION handle_updated_at() SET search_path = public;
ALTER FUNCTION activate_account_on_use() SET search_path = public;
ALTER FUNCTION recalculate_account_balance() SET search_path = public;
ALTER FUNCTION validate_journal_balance() SET search_path = public;

-- Auth trigger (no args, runs in auth schema context)
ALTER FUNCTION handle_new_user() SET search_path = public;

-- Seed functions
ALTER FUNCTION create_default_categories(UUID) SET search_path = public;
ALTER FUNCTION create_default_cost_center(UUID) SET search_path = public;
ALTER FUNCTION create_default_chart_of_accounts(UUID) SET search_path = public;

-- Core RPCs
ALTER FUNCTION create_transaction_with_journal(UUID, UUID, UUID, transaction_type, NUMERIC, TEXT, DATE, BOOLEAN, entry_source, TEXT, TEXT[], UUID) SET search_path = public;
ALTER FUNCTION reverse_transaction(UUID, UUID) SET search_path = public;
ALTER FUNCTION create_transfer_with_journal(UUID, UUID, UUID, NUMERIC, TEXT, DATE, BOOLEAN, entry_source) SET search_path = public;
