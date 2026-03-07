-- ============================================================
-- WealthOS Migration 001: Initial Schema v1.0
-- 13 tabelas | 9 ENUMs | 30 indexes | 52 RLS policies
-- 13 triggers | 5 functions | 1 Storage bucket
-- Source: wealthos-especificacao-v1.docx + wealthos-adendo-v1.1.docx
-- Applied: 2026-03-07
-- ============================================================

-- ============================================================
-- PART 1: ENUMs (9)
-- ============================================================

CREATE TYPE account_type AS ENUM ('checking', 'savings', 'credit_card', 'cash', 'investment');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE category_type AS ENUM ('income', 'expense');
CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
CREATE TYPE asset_category AS ENUM ('real_estate', 'vehicle', 'electronics', 'other');
CREATE TYPE tax_record_type AS ENUM ('income', 'deduction', 'asset', 'debt');
CREATE TYPE notification_type AS ENUM ('bill_due', 'budget_alert', 'insurance_expiry', 'account_deletion');
CREATE TYPE notification_status AS ENUM ('sent', 'failed', 'skipped');
CREATE TYPE value_change_source AS ENUM ('manual', 'depreciation');

-- ============================================================
-- PART 2: Tables (13)
-- ============================================================

-- 2.1 users_profile
CREATE TABLE users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  cpf_encrypted TEXT,
  default_currency TEXT NOT NULL DEFAULT 'BRL',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  deletion_requested_at TIMESTAMPTZ,
  encryption_key_encrypted TEXT,
  encryption_key_iv TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 accounts
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type account_type NOT NULL,
  initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  projected_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type category_type NOT NULL,
  icon TEXT,
  color TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4 transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type transaction_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  date DATE NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  recurrence_id UUID,
  transfer_pair_id UUID,
  notes TEXT,
  tags TEXT[],
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5 recurrences
CREATE TABLE recurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  frequency recurrence_frequency NOT NULL,
  interval_count INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,
  next_due_date DATE NOT NULL,
  template_transaction JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FK: transactions -> recurrences (created after recurrences exists)
ALTER TABLE transactions
  ADD CONSTRAINT fk_transactions_recurrence
  FOREIGN KEY (recurrence_id) REFERENCES recurrences(id) ON DELETE SET NULL;

-- 2.6 budgets
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  planned_amount NUMERIC(12,2) NOT NULL CHECK (planned_amount >= 0),
  alert_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 assets
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category asset_category NOT NULL,
  acquisition_date DATE NOT NULL,
  acquisition_value NUMERIC(14,2) NOT NULL,
  current_value NUMERIC(14,2) NOT NULL,
  depreciation_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
  notes_encrypted TEXT,
  insurance_policy TEXT,
  insurance_expiry DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.8 tax_records
CREATE TABLE tax_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  type tax_record_type NOT NULL,
  source TEXT,
  amount NUMERIC(14,2) NOT NULL,
  irrf_withheld NUMERIC(12,2) NOT NULL DEFAULT 0,
  details_encrypted TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.9 documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  related_table TEXT NOT NULL,
  related_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.10 asset_value_history (adendo v1.1)
CREATE TABLE asset_value_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_value NUMERIC(14,2) NOT NULL,
  new_value NUMERIC(14,2) NOT NULL,
  change_reason TEXT,
  change_source value_change_source NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.11 monthly_snapshots (adendo v1.1)
CREATE TABLE monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_projected NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_income NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_expense NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_assets NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- 2.12 notification_tokens (adendo v1.1)
CREATE TABLE notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  device_name TEXT,
  platform TEXT NOT NULL DEFAULT 'ios',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_token)
);

-- 2.13 notification_log (adendo v1.1)
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  reference_id UUID,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status notification_status NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PART 3: Indexes (30)
-- ============================================================

-- accounts
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_user_active ON accounts(user_id, is_active);

-- categories
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_user_type ON categories(user_id, type);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX idx_transactions_recurrence ON transactions(recurrence_id);
CREATE INDEX idx_transactions_transfer_pair ON transactions(transfer_pair_id);
CREATE INDEX idx_transactions_user_paid ON transactions(user_id, is_paid);
CREATE INDEX idx_transactions_tags ON transactions USING GIN(tags);

-- recurrences
CREATE INDEX idx_recurrences_user_id ON recurrences(user_id);
CREATE INDEX idx_recurrences_next_due ON recurrences(next_due_date) WHERE is_active = true;

-- budgets
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_user_month ON budgets(user_id, month);
CREATE UNIQUE INDEX idx_budgets_user_category_month ON budgets(user_id, category_id, month);

-- assets
CREATE INDEX idx_assets_user_id ON assets(user_id);

-- tax_records
CREATE INDEX idx_tax_records_user_id ON tax_records(user_id);
CREATE INDEX idx_tax_records_user_year ON tax_records(user_id, year);

-- documents
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_related ON documents(related_table, related_id);

-- asset_value_history
CREATE INDEX idx_avh_asset ON asset_value_history(asset_id);
CREATE INDEX idx_avh_user ON asset_value_history(user_id);

-- monthly_snapshots
CREATE INDEX idx_snapshots_user_month ON monthly_snapshots(user_id, month DESC);

-- notification_tokens
CREATE INDEX idx_notif_tokens_user ON notification_tokens(user_id);

-- notification_log
CREATE INDEX idx_notif_log_user ON notification_log(user_id);
CREATE INDEX idx_notif_log_user_type ON notification_log(user_id, type);

-- ============================================================
-- PART 4: Row Level Security (52 policies)
-- Pattern: auth.uid() = user_id (or id for users_profile)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_value_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- users_profile
CREATE POLICY "users_profile_select" ON users_profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_profile_insert" ON users_profile FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_profile_update" ON users_profile FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_profile_delete" ON users_profile FOR DELETE USING (auth.uid() = id);

-- accounts
CREATE POLICY "accounts_select" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "accounts_insert" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accounts_update" ON accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accounts_delete" ON accounts FOR DELETE USING (auth.uid() = user_id);

-- categories
CREATE POLICY "categories_select" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (auth.uid() = user_id);

-- transactions
CREATE POLICY "transactions_select" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update" ON transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_delete" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- recurrences
CREATE POLICY "recurrences_select" ON recurrences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recurrences_insert" ON recurrences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurrences_update" ON recurrences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurrences_delete" ON recurrences FOR DELETE USING (auth.uid() = user_id);

-- budgets
CREATE POLICY "budgets_select" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "budgets_insert" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_update" ON budgets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_delete" ON budgets FOR DELETE USING (auth.uid() = user_id);

-- assets
CREATE POLICY "assets_select" ON assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "assets_insert" ON assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "assets_update" ON assets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "assets_delete" ON assets FOR DELETE USING (auth.uid() = user_id);

-- tax_records
CREATE POLICY "tax_records_select" ON tax_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tax_records_insert" ON tax_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tax_records_update" ON tax_records FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tax_records_delete" ON tax_records FOR DELETE USING (auth.uid() = user_id);

-- documents
CREATE POLICY "documents_select" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_update" ON documents FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_delete" ON documents FOR DELETE USING (auth.uid() = user_id);

-- asset_value_history
CREATE POLICY "avh_select" ON asset_value_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "avh_insert" ON asset_value_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "avh_update" ON asset_value_history FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "avh_delete" ON asset_value_history FOR DELETE USING (auth.uid() = user_id);

-- monthly_snapshots
CREATE POLICY "snapshots_select" ON monthly_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "snapshots_insert" ON monthly_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "snapshots_update" ON monthly_snapshots FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "snapshots_delete" ON monthly_snapshots FOR DELETE USING (auth.uid() = user_id);

-- notification_tokens
CREATE POLICY "notif_tokens_select" ON notification_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_tokens_insert" ON notification_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif_tokens_update" ON notification_tokens FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif_tokens_delete" ON notification_tokens FOR DELETE USING (auth.uid() = user_id);

-- notification_log
CREATE POLICY "notif_log_select" ON notification_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_log_insert" ON notification_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif_log_update" ON notification_log FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif_log_delete" ON notification_log FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- PART 5: Functions and Triggers
-- ============================================================

-- Function: auto-update updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: auto-create profile on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profile (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: recalculate account balances
-- current_balance = initial_balance + SUM(paid income) - SUM(paid expense) +/- transfers
-- projected_balance = initial_balance + SUM(all income) - SUM(all expense) +/- transfers
CREATE OR REPLACE FUNCTION recalculate_account_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_account_id UUID;
  v_current NUMERIC(12,2);
  v_projected NUMERIC(12,2);
  v_initial NUMERIC(12,2);
BEGIN
  -- Determine which account to recalculate
  IF TG_OP = 'DELETE' THEN
    v_account_id := OLD.account_id;
  ELSE
    v_account_id := NEW.account_id;
  END IF;

  -- Also recalculate old account if account changed
  IF TG_OP = 'UPDATE' AND OLD.account_id IS DISTINCT FROM NEW.account_id THEN
    SELECT initial_balance INTO v_initial FROM accounts WHERE id = OLD.account_id;

    SELECT
      v_initial + COALESCE(SUM(CASE
        WHEN type = 'income' THEN amount
        WHEN type = 'expense' THEN -amount
        WHEN type = 'transfer' AND transfer_pair_id IS NOT NULL THEN
          CASE WHEN amount >= 0 THEN amount ELSE -amount END
        ELSE 0
      END), 0)
    INTO v_current
    FROM transactions
    WHERE account_id = OLD.account_id AND is_paid = true AND is_deleted = false;

    SELECT
      v_initial + COALESCE(SUM(CASE
        WHEN type = 'income' THEN amount
        WHEN type = 'expense' THEN -amount
        WHEN type = 'transfer' AND transfer_pair_id IS NOT NULL THEN
          CASE WHEN amount >= 0 THEN amount ELSE -amount END
        ELSE 0
      END), 0)
    INTO v_projected
    FROM transactions
    WHERE account_id = OLD.account_id AND is_deleted = false;

    UPDATE accounts SET current_balance = v_current, projected_balance = v_projected WHERE id = OLD.account_id;
  END IF;

  -- Recalculate target account
  SELECT initial_balance INTO v_initial FROM accounts WHERE id = v_account_id;

  SELECT
    v_initial + COALESCE(SUM(CASE
      WHEN type = 'income' THEN amount
      WHEN type = 'expense' THEN -amount
      WHEN type = 'transfer' AND transfer_pair_id IS NOT NULL THEN
        CASE WHEN amount >= 0 THEN amount ELSE -amount END
      ELSE 0
    END), 0)
  INTO v_current
  FROM transactions
  WHERE account_id = v_account_id AND is_paid = true AND is_deleted = false;

  SELECT
    v_initial + COALESCE(SUM(CASE
      WHEN type = 'income' THEN amount
      WHEN type = 'expense' THEN -amount
      WHEN type = 'transfer' AND transfer_pair_id IS NOT NULL THEN
        CASE WHEN amount >= 0 THEN amount ELSE -amount END
      ELSE 0
    END), 0)
  INTO v_projected
  FROM transactions
  WHERE account_id = v_account_id AND is_deleted = false;

  UPDATE accounts SET current_balance = v_current, projected_balance = v_projected WHERE id = v_account_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create profile on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Triggers: updated_at
CREATE TRIGGER set_updated_at_users_profile
  BEFORE UPDATE ON users_profile
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_accounts
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_categories
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_transactions
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_recurrences
  BEFORE UPDATE ON recurrences
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_budgets
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_assets
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_tax_records
  BEFORE UPDATE ON tax_records
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_documents
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_notification_tokens
  BEFORE UPDATE ON notification_tokens
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Trigger: recalculate account balance on transaction changes
CREATE TRIGGER recalc_balance_on_transaction
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION recalculate_account_balance();

-- ============================================================
-- PART 6: Storage
-- ============================================================

-- Create storage bucket for user documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-documents',
  'user-documents',
  false,
  10485760, -- 10 MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
);

-- Storage RLS: users can only access their own folder
CREATE POLICY "storage_user_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "storage_user_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "storage_user_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "storage_user_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
