-- ============================================
-- WealthOS - Migration 010: Bank Connections & Import
-- ============================================
-- Phase 9B: Standalone (without aggregator)
-- Table: bank_connections
-- Alters: transactions + accounts
-- RPC: auto_categorize_transaction, import_transactions_batch
-- ============================================

-- ─── 1. ENUM sync_status ─────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE sync_status AS ENUM ('active', 'syncing', 'error', 'expired', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. Table bank_connections ───────────────────────────────

CREATE TABLE IF NOT EXISTS bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'manual',
  provider_connection_id TEXT,
  institution_name TEXT NOT NULL,
  institution_logo_url TEXT,
  consent_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  sync_status sync_status NOT NULL DEFAULT 'manual',
  error_message TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE bank_connections IS 'Conexões bancárias. Provider manual = import CSV/OFX. Futuro: pluggy/belvo.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bank_connections_user_id ON bank_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_connections_active ON bank_connections(user_id, is_active) WHERE is_active = true;

-- RLS
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bank_connections"
  ON bank_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank_connections"
  ON bank_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank_connections"
  ON bank_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank_connections"
  ON bank_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER handle_bank_connections_updated_at
  BEFORE UPDATE ON bank_connections
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();


-- ─── 3. ALTER transactions: add import tracking fields ───────

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS bank_connection_id UUID REFERENCES bank_connections(id),
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS import_batch_id UUID;

CREATE INDEX IF NOT EXISTS idx_transactions_external_id
  ON transactions(user_id, external_id) WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_bank_connection
  ON transactions(bank_connection_id) WHERE bank_connection_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_import_batch
  ON transactions(import_batch_id) WHERE import_batch_id IS NOT NULL;


-- ─── 4. ALTER accounts: add external tracking ────────────────

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS external_account_id TEXT,
  ADD COLUMN IF NOT EXISTS bank_connection_id UUID REFERENCES bank_connections(id);


-- ─── 5. auto_categorize_transaction ──────────────────────────
-- Matches transaction description against category names/patterns.
-- Returns best-match category_id or NULL.

CREATE OR REPLACE FUNCTION auto_categorize_transaction(
  p_user_id UUID,
  p_description TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_id UUID;
  v_desc_lower TEXT := LOWER(TRIM(p_description));
BEGIN
  -- Try exact match on category name
  SELECT id INTO v_category_id
  FROM categories
  WHERE user_id = p_user_id
    AND LOWER(name) = v_desc_lower
  LIMIT 1;

  IF v_category_id IS NOT NULL THEN
    RETURN v_category_id;
  END IF;

  -- Try substring match: category name contained in description
  SELECT id INTO v_category_id
  FROM categories
  WHERE user_id = p_user_id
    AND v_desc_lower LIKE '%' || LOWER(name) || '%'
  ORDER BY LENGTH(name) DESC  -- Prefer longest match
  LIMIT 1;

  IF v_category_id IS NOT NULL THEN
    RETURN v_category_id;
  END IF;

  -- Try keyword match: common patterns
  SELECT id INTO v_category_id
  FROM categories
  WHERE user_id = p_user_id AND (
    (v_desc_lower LIKE '%mercado%' AND LOWER(name) = 'alimentação') OR
    (v_desc_lower LIKE '%supermercado%' AND LOWER(name) = 'alimentação') OR
    (v_desc_lower LIKE '%restaurante%' AND LOWER(name) = 'alimentação') OR
    (v_desc_lower LIKE '%ifood%' AND LOWER(name) = 'alimentação') OR
    (v_desc_lower LIKE '%uber%' AND LOWER(name) = 'transporte') OR
    (v_desc_lower LIKE '%99%' AND LOWER(name) = 'transporte') OR
    (v_desc_lower LIKE '%combustivel%' AND LOWER(name) = 'transporte') OR
    (v_desc_lower LIKE '%gasolina%' AND LOWER(name) = 'transporte') OR
    (v_desc_lower LIKE '%estacionamento%' AND LOWER(name) = 'transporte') OR
    (v_desc_lower LIKE '%farmacia%' AND LOWER(name) = 'saúde') OR
    (v_desc_lower LIKE '%drogaria%' AND LOWER(name) = 'saúde') OR
    (v_desc_lower LIKE '%hospital%' AND LOWER(name) = 'saúde') OR
    (v_desc_lower LIKE '%netflix%' AND LOWER(name) = 'lazer') OR
    (v_desc_lower LIKE '%spotify%' AND LOWER(name) = 'lazer') OR
    (v_desc_lower LIKE '%amazon%' AND LOWER(name) = 'compras') OR
    (v_desc_lower LIKE '%energia%' AND LOWER(name) = 'moradia') OR
    (v_desc_lower LIKE '%luz%' AND LOWER(name) = 'moradia') OR
    (v_desc_lower LIKE '%agua%' AND LOWER(name) = 'moradia') OR
    (v_desc_lower LIKE '%internet%' AND LOWER(name) = 'moradia') OR
    (v_desc_lower LIKE '%aluguel%' AND LOWER(name) = 'moradia') OR
    (v_desc_lower LIKE '%condominio%' AND LOWER(name) = 'moradia') OR
    (v_desc_lower LIKE '%salario%' AND LOWER(name) = 'salário') OR
    (v_desc_lower LIKE '%pagamento%folha%' AND LOWER(name) = 'salário') OR
    (v_desc_lower LIKE '%transferencia%' AND LOWER(name) = 'transferências') OR
    (v_desc_lower LIKE '%pix%' AND LOWER(name) = 'transferências')
  )
  LIMIT 1;

  RETURN v_category_id; -- NULL if no match
END;
$$;

GRANT EXECUTE ON FUNCTION auto_categorize_transaction(UUID, TEXT) TO authenticated;


-- ─── 6. import_transactions_batch ────────────────────────────
-- Bulk import parsed transactions. Skips duplicates by external_id.
-- Returns count of imported vs skipped.

CREATE OR REPLACE FUNCTION import_transactions_batch(
  p_user_id UUID,
  p_account_id UUID,
  p_bank_connection_id UUID,
  p_batch_id UUID,
  p_transactions JSONB  -- array of {date, amount, description, type, external_id?}
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx JSONB;
  v_imported INT := 0;
  v_skipped INT := 0;
  v_categorized INT := 0;
  v_cat_id UUID;
  v_tx_type transaction_type;
  v_amount NUMERIC;
  v_ext_id TEXT;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  FOR v_tx IN SELECT * FROM jsonb_array_elements(p_transactions)
  LOOP
    v_ext_id := v_tx->>'external_id';
    v_amount := ABS((v_tx->>'amount')::NUMERIC);

    -- Skip duplicates by external_id
    IF v_ext_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM transactions
      WHERE user_id = p_user_id AND external_id = v_ext_id AND is_deleted = false
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Determine type
    IF (v_tx->>'amount')::NUMERIC >= 0 THEN
      v_tx_type := 'income';
    ELSE
      v_tx_type := 'expense';
    END IF;

    -- Override if provided
    IF v_tx->>'type' IS NOT NULL AND v_tx->>'type' != '' THEN
      v_tx_type := (v_tx->>'type')::transaction_type;
    END IF;

    -- Auto-categorize
    v_cat_id := auto_categorize_transaction(p_user_id, COALESCE(v_tx->>'description', ''));
    IF v_cat_id IS NOT NULL THEN
      v_categorized := v_categorized + 1;
    END IF;

    -- Insert transaction (uses existing trigger for balance recalc)
    INSERT INTO transactions (
      user_id, account_id, category_id, type, amount, description,
      date, is_paid, source, bank_connection_id, external_id, import_batch_id
    ) VALUES (
      p_user_id,
      p_account_id,
      v_cat_id,
      v_tx_type,
      v_amount,
      v_tx->>'description',
      (v_tx->>'date')::DATE,
      true,
      CASE WHEN p_bank_connection_id IS NOT NULL THEN 'bank_feed'::entry_source ELSE 'csv_import'::entry_source END,
      p_bank_connection_id,
      v_ext_id,
      p_batch_id
    );

    v_imported := v_imported + 1;
  END LOOP;

  -- Update bank_connection last_sync
  IF p_bank_connection_id IS NOT NULL THEN
    UPDATE bank_connections
    SET last_sync_at = now(), sync_status = 'active', updated_at = now()
    WHERE id = p_bank_connection_id;
  END IF;

  RETURN json_build_object(
    'status', 'ok',
    'imported', v_imported,
    'skipped', v_skipped,
    'categorized', v_categorized,
    'batch_id', p_batch_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION import_transactions_batch(UUID, UUID, UUID, UUID, JSONB) TO authenticated;
