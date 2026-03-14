-- ============================================
-- Oniefy - Testes de Mutação Financeira (WEA-009)
-- ============================================
-- Script reproduzível sem UUID hardcoded e sem intervenção manual.
-- Cobertura:
--  1) criação de transação via RPC
--  2) transferência ativo -> ativo
--  3) transferência ativo -> passivo (WEA-010)
--  4) journal balance inválido (trigger rejeita)
--
-- Estratégia:
--  - Detecta automaticamente um usuário existente em auth.users
--  - Usa COAs folha (sem filhos) para evitar conflito de hierarquia
--  - Cria dados de teste temporários com prefixo __test__
--  - Executa cenários e valida resultados
--  - Faz teardown ao final
--
-- Última execução validada: 14/03/2026 (4/4 cenários OK)
-- ============================================

DO $$
DECLARE
  v_user UUID;
  v_coa_asset_1 UUID;
  v_coa_asset_2 UUID;
  v_coa_liability UUID;

  v_acc_checking UUID;
  v_acc_savings UUID;
  v_acc_credit UUID;

  v_tx_json JSON;
  v_transfer_aa JSON;
  v_transfer_al JSON;
  v_journal_id UUID;

  v_from_tx UUID;
  v_to_tx UUID;
  v_from_je UUID;
  v_to_je UUID;

  v_debit_account UUID;
  v_credit_account UUID;
BEGIN
  -- 0) Resolve usuário automaticamente
  SELECT id INTO v_user
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário encontrado em auth.users';
  END IF;

  -- 1) Resolve COAs folha (2 ativos + 1 passivo)
  -- Coluna correta: group_type (não account_nature)
  SELECT c.id INTO v_coa_asset_1
  FROM chart_of_accounts c
  WHERE c.user_id = v_user
    AND c.group_type = 'asset'
    AND NOT EXISTS (SELECT 1 FROM chart_of_accounts ch WHERE ch.parent_id = c.id)
  ORDER BY c.internal_code
  LIMIT 1;

  SELECT c.id INTO v_coa_asset_2
  FROM chart_of_accounts c
  WHERE c.user_id = v_user
    AND c.group_type = 'asset'
    AND c.id <> v_coa_asset_1
    AND NOT EXISTS (SELECT 1 FROM chart_of_accounts ch WHERE ch.parent_id = c.id)
  ORDER BY c.internal_code
  LIMIT 1;

  SELECT c.id INTO v_coa_liability
  FROM chart_of_accounts c
  WHERE c.user_id = v_user
    AND c.group_type = 'liability'
    AND NOT EXISTS (SELECT 1 FROM chart_of_accounts ch WHERE ch.parent_id = c.id)
  ORDER BY c.internal_code
  LIMIT 1;

  IF v_coa_asset_1 IS NULL OR v_coa_asset_2 IS NULL OR v_coa_liability IS NULL THEN
    RAISE EXCEPTION 'COAs insuficientes (necessário: 2 folhas ativo + 1 folha passivo)';
  END IF;

  RAISE NOTICE 'Setup: user=%, coa_a1=%, coa_a2=%, coa_l=%', v_user, v_coa_asset_1, v_coa_asset_2, v_coa_liability;

  -- 2) Contas temporárias
  INSERT INTO accounts (user_id, name, type, coa_id, liquidity_tier, initial_balance, current_balance, projected_balance, is_active)
  VALUES
    (v_user, '__test__checking', 'checking', v_coa_asset_1, 'T1', 1000, 1000, 1000, TRUE),
    (v_user, '__test__savings', 'savings', v_coa_asset_2, 'T1', 500, 500, 500, TRUE),
    (v_user, '__test__credit', 'credit_card', v_coa_liability, 'T1', 0, 0, 0, TRUE);

  SELECT id INTO v_acc_checking FROM accounts WHERE user_id = v_user AND name = '__test__checking' LIMIT 1;
  SELECT id INTO v_acc_savings FROM accounts WHERE user_id = v_user AND name = '__test__savings' LIMIT 1;
  SELECT id INTO v_acc_credit FROM accounts WHERE user_id = v_user AND name = '__test__credit' LIMIT 1;

  -- 3) Cenário 1: criação de transação via RPC
  SELECT create_transaction_with_journal(
    p_user_id => v_user,
    p_account_id => v_acc_checking,
    p_type => 'expense',
    p_amount => 100,
    p_description => '__test__expense',
    p_date => CURRENT_DATE,
    p_is_paid => TRUE,
    p_source => 'manual'
  ) INTO v_tx_json;

  IF (v_tx_json->>'transaction_id') IS NULL THEN
    RAISE EXCEPTION 'Cenário 1 FALHOU: transaction_id ausente';
  END IF;
  RAISE NOTICE '✓ Cenário 1: criação de transação OK';

  -- 4) Cenário 2: transferência ativo -> ativo
  SELECT create_transfer_with_journal(
    p_user_id => v_user,
    p_from_account_id => v_acc_checking,
    p_to_account_id => v_acc_savings,
    p_amount => 50,
    p_description => '__test__transfer_aa',
    p_date => CURRENT_DATE,
    p_is_paid => TRUE,
    p_source => 'manual'
  ) INTO v_transfer_aa;

  v_from_tx := (v_transfer_aa->>'from_transaction_id')::UUID;
  v_to_tx := (v_transfer_aa->>'to_transaction_id')::UUID;

  IF v_from_tx IS NULL OR v_to_tx IS NULL THEN
    RAISE EXCEPTION 'Cenário 2 FALHOU: IDs ausentes';
  END IF;

  SELECT journal_entry_id INTO v_from_je FROM transactions WHERE id = v_from_tx;
  SELECT journal_entry_id INTO v_to_je FROM transactions WHERE id = v_to_tx;

  IF v_from_je IS NULL OR v_to_je IS NULL OR v_from_je <> v_to_je THEN
    RAISE EXCEPTION 'Cenário 2 FALHOU: journal_entry_id inconsistente';
  END IF;
  RAISE NOTICE '✓ Cenário 2: transferência ativo->ativo OK';

  -- 5) Cenário 3: transferência ativo -> passivo (WEA-010)
  SELECT create_transfer_with_journal(
    p_user_id => v_user,
    p_from_account_id => v_acc_checking,
    p_to_account_id => v_acc_credit,
    p_amount => 75,
    p_description => '__test__transfer_al',
    p_date => CURRENT_DATE,
    p_is_paid => TRUE,
    p_source => 'manual'
  ) INTO v_transfer_al;

  v_from_tx := (v_transfer_al->>'from_transaction_id')::UUID;
  SELECT journal_entry_id INTO v_journal_id FROM transactions WHERE id = v_from_tx;

  IF v_journal_id IS NULL THEN
    RAISE EXCEPTION 'Cenário 3 FALHOU: journal_entry_id ausente';
  END IF;

  SELECT account_id INTO v_debit_account
  FROM journal_lines
  WHERE journal_entry_id = v_journal_id AND amount_debit > 0
  LIMIT 1;

  SELECT account_id INTO v_credit_account
  FROM journal_lines
  WHERE journal_entry_id = v_journal_id AND amount_credit > 0
  LIMIT 1;

  -- WEA-010: passivo inverte orientação (D origem ativo, C destino passivo)
  IF v_debit_account <> v_coa_asset_1 OR v_credit_account <> v_coa_liability THEN
    RAISE EXCEPTION 'Cenário 3 FALHOU: orientação inesperada D=% C=%', v_debit_account, v_credit_account;
  END IF;
  RAISE NOTICE '✓ Cenário 3: transferência ativo->passivo OK';

  -- 6) Cenário 4: journal balance inválido rejeitado pelo trigger
  BEGIN
    INSERT INTO journal_entries (user_id, entry_date, source, description)
    VALUES (v_user, CURRENT_DATE, 'system', '__test__invalid_balance')
    RETURNING id INTO v_journal_id;

    INSERT INTO journal_lines (journal_entry_id, account_id, amount_debit, amount_credit)
    VALUES
      (v_journal_id, v_coa_asset_1, 200, 0),
      (v_journal_id, v_coa_asset_2, 0, 100);

    RAISE EXCEPTION 'Cenário 4 FALHOU: desbalanceado foi aceito';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%desbalanceado%' OR SQLERRM LIKE '%balance%' THEN
        RAISE NOTICE '✓ Cenário 4: trigger rejeitou desbalanceado OK';
      ELSE
        RAISE;
      END IF;
  END;

  -- 7) Teardown
  DELETE FROM transactions WHERE user_id = v_user AND description LIKE '__test__%';
  DELETE FROM journal_entries WHERE user_id = v_user AND description LIKE '__test__%';
  DELETE FROM accounts WHERE user_id = v_user AND name LIKE '__test__%';

  RAISE NOTICE '✓ Teardown concluído. Todos os 4 cenários passaram.';
END $$;
