-- Prevent duplicate COA internal_codes per user (defensive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_coa_unique_code_user
  ON chart_of_accounts (user_id, internal_code);
