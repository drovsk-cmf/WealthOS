-- ============================================
-- WealthOS - Migration 026: Transfer rules for liability accounts
-- ============================================
-- WEA-010: Adjust create_transfer_with_journal() to invert
-- debit/credit orientation when source or destination account
-- is a liability account (credit_card, loan, financing).
-- ============================================

CREATE OR REPLACE FUNCTION create_transfer_with_journal(
  p_user_id         UUID,
  p_from_account_id UUID,
  p_to_account_id   UUID,
  p_amount          NUMERIC(14,2),
  p_description     TEXT DEFAULT 'Transferência entre contas',
  p_date            DATE DEFAULT CURRENT_DATE,
  p_is_paid         BOOLEAN DEFAULT TRUE,
  p_source          entry_source DEFAULT 'manual'
)
RETURNS JSON AS $$
DECLARE
  v_from_coa_id     UUID;
  v_to_coa_id       UUID;
  v_from_type       account_type;
  v_to_type         account_type;
  v_from_tx_id      UUID;
  v_to_tx_id        UUID;
  v_journal_id      UUID;
  v_now             TIMESTAMPTZ := NOW();
  v_has_liability   BOOLEAN := FALSE;
BEGIN
  -- 0. Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Valor da transferência deve ser positivo';
  END IF;

  IF p_from_account_id = p_to_account_id THEN
    RAISE EXCEPTION 'Conta de origem e destino devem ser diferentes';
  END IF;

  -- 1. Validate source account
  SELECT coa_id, type INTO v_from_coa_id, v_from_type
  FROM accounts
  WHERE id = p_from_account_id AND user_id = p_user_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta de origem não encontrada ou inativa';
  END IF;

  -- 2. Validate destination account
  SELECT coa_id, type INTO v_to_coa_id, v_to_type
  FROM accounts
  WHERE id = p_to_account_id AND user_id = p_user_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta de destino não encontrada ou inativa';
  END IF;

  v_has_liability := v_from_type IN ('credit_card', 'loan', 'financing')
    OR v_to_type IN ('credit_card', 'loan', 'financing');

  -- 3. Create outgoing transaction (source)
  INSERT INTO transactions (
    user_id, account_id, type, amount, description,
    date, is_paid, source, occurred_at, posted_at
  ) VALUES (
    p_user_id, p_from_account_id, 'transfer', p_amount, p_description,
    p_date, p_is_paid, p_source,
    v_now, CASE WHEN p_is_paid THEN v_now ELSE NULL END
  )
  RETURNING id INTO v_from_tx_id;

  -- 4. Create incoming transaction (destination)
  INSERT INTO transactions (
    user_id, account_id, type, amount, description,
    date, is_paid, source, occurred_at, posted_at,
    transfer_pair_id
  ) VALUES (
    p_user_id, p_to_account_id, 'transfer', p_amount, p_description,
    p_date, p_is_paid, p_source,
    v_now, CASE WHEN p_is_paid THEN v_now ELSE NULL END,
    v_from_tx_id
  )
  RETURNING id INTO v_to_tx_id;

  -- 5. Link back the source to destination
  UPDATE transactions
  SET transfer_pair_id = v_to_tx_id
  WHERE id = v_from_tx_id;

  -- 6. Create journal entry (single entry for the transfer event)
  IF v_from_coa_id IS NOT NULL AND v_to_coa_id IS NOT NULL THEN
    INSERT INTO journal_entries (
      user_id, entry_date, occurred_at, posted_at,
      source, description, transaction_id
    ) VALUES (
      p_user_id, p_date, v_now,
      CASE WHEN p_is_paid THEN v_now ELSE NULL END,
      p_source, p_description, v_from_tx_id
    )
    RETURNING id INTO v_journal_id;

    -- 7. Journal lines
    -- Active-only transfers keep historical orientation: D destination / C source.
    -- If source or destination is liability, orientation is inverted.
    IF v_has_liability THEN
      INSERT INTO journal_lines (journal_entry_id, account_id, amount_debit, amount_credit, memo)
      VALUES
        (v_journal_id, v_from_coa_id, p_amount, 0, 'Transferência enviada (passivo)'),
        (v_journal_id, v_to_coa_id, 0, p_amount, 'Transferência recebida (passivo)');
    ELSE
      INSERT INTO journal_lines (journal_entry_id, account_id, amount_debit, amount_credit, memo)
      VALUES
        (v_journal_id, v_to_coa_id, p_amount, 0, 'Transferência recebida'),
        (v_journal_id, v_from_coa_id, 0, p_amount, 'Transferência enviada');
    END IF;

    -- Link journal to both transactions
    UPDATE transactions
    SET journal_entry_id = v_journal_id
    WHERE id IN (v_from_tx_id, v_to_tx_id);
  END IF;

  RETURN json_build_object(
    'from_transaction_id', v_from_tx_id,
    'to_transaction_id', v_to_tx_id,
    'journal_entry_id', v_journal_id,
    'amount', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_transfer_with_journal IS
'Atomic transfer between two accounts.
Creates 2 transactions (type=transfer, linked by transfer_pair_id) +
1 journal entry + 2 journal lines.
When source or destination account is liability (credit_card/loan/financing),
debit/credit orientation is inverted to handle passive-account transfers.';

GRANT EXECUTE ON FUNCTION create_transfer_with_journal(UUID, UUID, UUID, NUMERIC, TEXT, DATE, BOOLEAN, entry_source) TO authenticated;
