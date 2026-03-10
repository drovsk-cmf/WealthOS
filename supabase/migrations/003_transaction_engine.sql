-- ============================================
-- WealthOS - Migration 003: Transaction Engine
-- ============================================
-- Atomic function: create_transaction_with_journal()
-- Creates transaction + journal_entry + journal_lines in one call.
-- Balance recalculation handled by existing trigger.
-- ============================================

CREATE OR REPLACE FUNCTION create_transaction_with_journal(
  p_user_id         UUID,
  p_account_id      UUID,
  p_category_id     UUID DEFAULT NULL,
  p_type            transaction_type DEFAULT 'expense',
  p_amount          NUMERIC(14,2) DEFAULT 0,
  p_description     TEXT DEFAULT NULL,
  p_date            DATE DEFAULT CURRENT_DATE,
  p_is_paid         BOOLEAN DEFAULT FALSE,
  p_source          entry_source DEFAULT 'manual',
  p_notes           TEXT DEFAULT NULL,
  p_tags            TEXT[] DEFAULT NULL,
  p_counterpart_coa_id UUID DEFAULT NULL  -- optional: explicit COA for expense/revenue line
)
RETURNS JSON AS $$
DECLARE
  v_transaction_id  UUID;
  v_journal_id      UUID;
  v_account_coa_id  UUID;
  v_counter_coa_id  UUID;
  v_account_type    account_type;
  v_debit_acct      UUID;
  v_credit_acct     UUID;
  v_now             TIMESTAMPTZ := NOW();
BEGIN
  -- 1. Validate account exists and belongs to user
  SELECT coa_id, type INTO v_account_coa_id, v_account_type
  FROM accounts
  WHERE id = p_account_id AND user_id = p_user_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta não encontrada ou inativa';
  END IF;

  -- 2. Resolve counterpart COA (expense/revenue chart_of_accounts entry)
  IF p_counterpart_coa_id IS NOT NULL THEN
    v_counter_coa_id := p_counterpart_coa_id;
  ELSE
    -- Auto-resolve: use fallback based on transaction type
    IF p_type = 'expense' THEN
      SELECT id INTO v_counter_coa_id
      FROM chart_of_accounts
      WHERE user_id = p_user_id AND internal_code = '5.19.01'
      LIMIT 1;
    ELSIF p_type = 'income' THEN
      SELECT id INTO v_counter_coa_id
      FROM chart_of_accounts
      WHERE user_id = p_user_id AND internal_code = '4.3.02'
      LIMIT 1;
    END IF;
  END IF;

  -- 3. Create transaction
  INSERT INTO transactions (
    user_id, account_id, category_id, type, amount,
    description, date, is_paid, source, notes, tags,
    occurred_at, posted_at
  ) VALUES (
    p_user_id, p_account_id, p_category_id, p_type, p_amount,
    p_description, p_date, p_is_paid, p_source, p_notes, p_tags,
    v_now, CASE WHEN p_is_paid THEN v_now ELSE NULL END
  )
  RETURNING id INTO v_transaction_id;

  -- 4. Create journal_entry (only if we have both COA entries)
  IF v_account_coa_id IS NOT NULL AND v_counter_coa_id IS NOT NULL THEN

    INSERT INTO journal_entries (
      user_id, entry_date, occurred_at, posted_at,
      source, description, transaction_id
    ) VALUES (
      p_user_id, p_date, v_now,
      CASE WHEN p_is_paid THEN v_now ELSE NULL END,
      p_source, p_description, v_transaction_id
    )
    RETURNING id INTO v_journal_id;

    -- 5. Determine debit/credit based on type + account type
    IF p_type = 'income' THEN
      -- Income: Debit asset (bank increases), Credit revenue
      v_debit_acct := v_account_coa_id;
      v_credit_acct := v_counter_coa_id;
    ELSIF p_type = 'expense' AND v_account_type = 'credit_card' THEN
      -- Expense via credit card: Debit expense, Credit liability (debt increases)
      v_debit_acct := v_counter_coa_id;
      v_credit_acct := v_account_coa_id;
    ELSIF p_type = 'expense' THEN
      -- Expense via bank: Debit expense, Credit asset (bank decreases)
      v_debit_acct := v_counter_coa_id;
      v_credit_acct := v_account_coa_id;
    END IF;

    -- 6. Create journal_lines (debit + credit)
    IF v_debit_acct IS NOT NULL AND v_credit_acct IS NOT NULL THEN
      INSERT INTO journal_lines (journal_entry_id, account_id, amount_debit, amount_credit)
      VALUES
        (v_journal_id, v_debit_acct, p_amount, 0),
        (v_journal_id, v_credit_acct, 0, p_amount);

      -- Link journal back to transaction
      UPDATE transactions
      SET journal_entry_id = v_journal_id
      WHERE id = v_transaction_id;
    END IF;

  END IF;

  -- Return both IDs
  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'journal_entry_id', v_journal_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_transaction_with_journal IS
'Atomic creation of transaction + journal_entry + journal_lines.
Handles debit/credit rules based on transaction type and account type.
Balance recalculation handled by existing trigger on transactions.';


-- ============================================
-- Reverse transaction (estorno) - for Lote 2.10
-- Placeholder: will be enhanced later
-- ============================================

CREATE OR REPLACE FUNCTION reverse_transaction(
  p_user_id        UUID,
  p_transaction_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_tx             RECORD;
  v_je             RECORD;
  v_new_je_id      UUID;
BEGIN
  -- 1. Get original transaction
  SELECT * INTO v_tx
  FROM transactions
  WHERE id = p_transaction_id AND user_id = p_user_id AND is_deleted = FALSE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transação não encontrada';
  END IF;

  -- 2. Soft-delete the transaction
  UPDATE transactions
  SET is_deleted = TRUE, updated_at = NOW()
  WHERE id = p_transaction_id;

  -- 3. If has journal_entry, create reversal
  IF v_tx.journal_entry_id IS NOT NULL THEN
    -- Create reversal journal entry
    INSERT INTO journal_entries (
      user_id, entry_date, occurred_at, posted_at,
      source, description, is_reversal, reversed_entry_id,
      transaction_id
    ) VALUES (
      p_user_id, CURRENT_DATE, NOW(), NOW(),
      'system', 'Estorno: ' || COALESCE(v_tx.description, ''),
      TRUE, v_tx.journal_entry_id,
      p_transaction_id
    )
    RETURNING id INTO v_new_je_id;

    -- Copy journal_lines with swapped debit/credit
    INSERT INTO journal_lines (journal_entry_id, account_id, amount_debit, amount_credit, memo)
    SELECT v_new_je_id, account_id, amount_credit, amount_debit, 'Estorno'
    FROM journal_lines
    WHERE journal_entry_id = v_tx.journal_entry_id;
  END IF;

  RETURN json_build_object(
    'reversed_transaction_id', p_transaction_id,
    'reversal_journal_id', v_new_je_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reverse_transaction IS
'Soft-deletes a transaction and creates a reversal journal entry with swapped debit/credit lines.
Append-only: original journal_entry is never modified.';
