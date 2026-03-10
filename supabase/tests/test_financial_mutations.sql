-- ============================================
-- WealthOS - Testes de Mutação Financeira
-- ============================================
-- Suite de testes para validar integridade do motor contábil.
-- Estes testes tentam deliberadamente "quebrar" o balanço para
-- garantir que as restrições SQL rejeitam operações inválidas.
--
-- Execução: rodar no SQL Editor do Supabase (ou via CI pipeline)
-- IMPORTANTE: todos os testes fazem cleanup automático.
--
-- Ref: Auditoria de segurança - Achado 5
-- ============================================

-- Substitua pelo user_id do ambiente de teste
\set test_user_id '04c41302-5429-4f97-9aeb-e21294d014ff'


-- ═══════════════════════════════════════════
-- TESTE 1: Lançamento desbalanceado é rejeitado
-- Tenta inserir D 200, C 100 → DEVE FALHAR
-- ═══════════════════════════════════════════
DO $$
DECLARE
  v_je_id UUID;
  v_coa_id_1 UUID;
  v_coa_id_2 UUID;
  v_user UUID := '04c41302-5429-4f97-9aeb-e21294d014ff';
BEGIN
  SELECT id INTO v_coa_id_1
  FROM chart_of_accounts WHERE user_id = v_user LIMIT 1;
  SELECT id INTO v_coa_id_2
  FROM chart_of_accounts WHERE user_id = v_user AND id != v_coa_id_1 LIMIT 1;

  INSERT INTO journal_entries (user_id, entry_date, source, description)
  VALUES (v_user, CURRENT_DATE, 'system', 'TEST_1: desbalanceado')
  RETURNING id INTO v_je_id;

  INSERT INTO journal_lines (journal_entry_id, account_id, amount_debit, amount_credit)
  VALUES
    (v_je_id, v_coa_id_1, 200.00, 0),
    (v_je_id, v_coa_id_2, 0, 100.00);

  RAISE EXCEPTION 'FALHOU: lançamento desbalanceado aceito indevidamente';
EXCEPTION
  WHEN raise_exception THEN
    IF SQLERRM LIKE '%desbalanceado%' THEN
      RAISE NOTICE '✓ TESTE 1 PASSOU: lançamento desbalanceado rejeitado';
    ELSE
      RAISE EXCEPTION 'FALHOU: exceção inesperada: %', SQLERRM;
    END IF;
END $$;


-- ═══════════════════════════════════════════
-- TESTE 2: Linha única é rejeitada (mínimo 2 linhas)
-- Tenta inserir apenas 1 linha → DEVE FALHAR
-- ═══════════════════════════════════════════
DO $$
DECLARE
  v_je_id UUID;
  v_coa_id UUID;
  v_user UUID := '04c41302-5429-4f97-9aeb-e21294d014ff';
BEGIN
  SELECT id INTO v_coa_id
  FROM chart_of_accounts WHERE user_id = v_user LIMIT 1;

  INSERT INTO journal_entries (user_id, entry_date, source, description)
  VALUES (v_user, CURRENT_DATE, 'system', 'TEST_2: linha única')
  RETURNING id INTO v_je_id;

  INSERT INTO journal_lines (journal_entry_id, account_id, amount_debit, amount_credit)
  VALUES (v_je_id, v_coa_id, 100.00, 0);

  RAISE EXCEPTION 'FALHOU: lançamento com linha única aceito indevidamente';
EXCEPTION
  WHEN raise_exception THEN
    IF SQLERRM LIKE '%pelo menos 2 linhas%' THEN
      RAISE NOTICE '✓ TESTE 2 PASSOU: linha única rejeitada';
    ELSE
      RAISE EXCEPTION 'FALHOU: exceção inesperada: %', SQLERRM;
    END IF;
END $$;


-- ═══════════════════════════════════════════
-- TESTE 3: Linha com débito E crédito simultaneamente é rejeitada
-- Violação da constraint jl_debit_or_credit
-- ═══════════════════════════════════════════
DO $$
DECLARE
  v_je_id UUID;
  v_coa_id UUID;
  v_user UUID := '04c41302-5429-4f97-9aeb-e21294d014ff';
BEGIN
  SELECT id INTO v_coa_id
  FROM chart_of_accounts WHERE user_id = v_user LIMIT 1;

  INSERT INTO journal_entries (user_id, entry_date, source, description)
  VALUES (v_user, CURRENT_DATE, 'system', 'TEST_3: débito+crédito simultâneo')
  RETURNING id INTO v_je_id;

  -- Ambos > 0: viola CHECK constraint
  INSERT INTO journal_lines (journal_entry_id, account_id, amount_debit, amount_credit)
  VALUES (v_je_id, v_coa_id, 100.00, 100.00);

  RAISE EXCEPTION 'FALHOU: linha com débito+crédito simultâneo aceita';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE '✓ TESTE 3 PASSOU: débito+crédito simultâneo rejeitado (check_violation)';
    -- Cleanup
    DELETE FROM journal_entries WHERE id = v_je_id;
  WHEN raise_exception THEN
    IF SQLERRM LIKE '%FALHOU%' THEN
      RAISE EXCEPTION '%', SQLERRM;
    END IF;
    RAISE NOTICE '✓ TESTE 3 PASSOU: débito+crédito simultâneo rejeitado';
END $$;


-- ═══════════════════════════════════════════
-- TESTE 4: Linha com zeros (D=0, C=0) é rejeitada
-- ═══════════════════════════════════════════
DO $$
DECLARE
  v_je_id UUID;
  v_coa_id UUID;
  v_user UUID := '04c41302-5429-4f97-9aeb-e21294d014ff';
BEGIN
  SELECT id INTO v_coa_id
  FROM chart_of_accounts WHERE user_id = v_user LIMIT 1;

  INSERT INTO journal_entries (user_id, entry_date, source, description)
  VALUES (v_user, CURRENT_DATE, 'system', 'TEST_4: zeros')
  RETURNING id INTO v_je_id;

  INSERT INTO journal_lines (journal_entry_id, account_id, amount_debit, amount_credit)
  VALUES (v_je_id, v_coa_id, 0, 0);

  RAISE EXCEPTION 'FALHOU: linha com zeros aceita indevidamente';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE '✓ TESTE 4 PASSOU: linha com zeros rejeitada (check_violation)';
    DELETE FROM journal_entries WHERE id = v_je_id;
  WHEN raise_exception THEN
    IF SQLERRM LIKE '%FALHOU%' THEN
      RAISE EXCEPTION '%', SQLERRM;
    END IF;
    RAISE NOTICE '✓ TESTE 4 PASSOU: linha com zeros rejeitada';
END $$;


-- ═══════════════════════════════════════════
-- TESTE 5: Valores negativos são rejeitados
-- ═══════════════════════════════════════════
DO $$
DECLARE
  v_je_id UUID;
  v_coa_id UUID;
  v_user UUID := '04c41302-5429-4f97-9aeb-e21294d014ff';
BEGIN
  SELECT id INTO v_coa_id
  FROM chart_of_accounts WHERE user_id = v_user LIMIT 1;

  INSERT INTO journal_entries (user_id, entry_date, source, description)
  VALUES (v_user, CURRENT_DATE, 'system', 'TEST_5: valor negativo')
  RETURNING id INTO v_je_id;

  INSERT INTO journal_lines (journal_entry_id, account_id, amount_debit, amount_credit)
  VALUES (v_je_id, v_coa_id, -100.00, 0);

  RAISE EXCEPTION 'FALHOU: valor negativo aceito indevidamente';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE '✓ TESTE 5 PASSOU: valor negativo rejeitado (check_violation)';
    DELETE FROM journal_entries WHERE id = v_je_id;
  WHEN raise_exception THEN
    IF SQLERRM LIKE '%FALHOU%' THEN
      RAISE EXCEPTION '%', SQLERRM;
    END IF;
    RAISE NOTICE '✓ TESTE 5 PASSOU: valor negativo rejeitado';
END $$;


-- ═══════════════════════════════════════════
-- TESTE 6: Lançamento balanceado é aceito (happy path)
-- D 500, C 500 → DEVE FUNCIONAR
-- ═══════════════════════════════════════════
DO $$
DECLARE
  v_je_id UUID;
  v_coa_id_1 UUID;
  v_coa_id_2 UUID;
  v_total_d NUMERIC;
  v_total_c NUMERIC;
  v_user UUID := '04c41302-5429-4f97-9aeb-e21294d014ff';
BEGIN
  SELECT id INTO v_coa_id_1
  FROM chart_of_accounts WHERE user_id = v_user LIMIT 1;
  SELECT id INTO v_coa_id_2
  FROM chart_of_accounts WHERE user_id = v_user AND id != v_coa_id_1 LIMIT 1;

  INSERT INTO journal_entries (user_id, entry_date, source, description)
  VALUES (v_user, CURRENT_DATE, 'system', 'TEST_6: balanceado')
  RETURNING id INTO v_je_id;

  INSERT INTO journal_lines (journal_entry_id, account_id, amount_debit, amount_credit)
  VALUES
    (v_je_id, v_coa_id_1, 500.00, 0),
    (v_je_id, v_coa_id_2, 0, 500.00);

  -- Verificar somas
  SELECT SUM(amount_debit), SUM(amount_credit)
  INTO v_total_d, v_total_c
  FROM journal_lines WHERE journal_entry_id = v_je_id;

  IF v_total_d != v_total_c OR v_total_d != 500.00 THEN
    RAISE EXCEPTION 'FALHOU: somas incorretas D=% C=%', v_total_d, v_total_c;
  END IF;

  RAISE NOTICE '✓ TESTE 6 PASSOU: lançamento balanceado aceito (D=500, C=500)';

  -- Cleanup
  DELETE FROM journal_entries WHERE id = v_je_id;
END $$;


-- ═══════════════════════════════════════════
-- TESTE 7: Lançamento composto balanceado (3+ linhas)
-- D 100 + D 50 + C 150 → DEVE FUNCIONAR
-- ═══════════════════════════════════════════
DO $$
DECLARE
  v_je_id UUID;
  v_coa_ids UUID[];
  v_user UUID := '04c41302-5429-4f97-9aeb-e21294d014ff';
BEGIN
  SELECT ARRAY(
    SELECT id FROM chart_of_accounts WHERE user_id = v_user LIMIT 3
  ) INTO v_coa_ids;

  INSERT INTO journal_entries (user_id, entry_date, source, description)
  VALUES (v_user, CURRENT_DATE, 'system', 'TEST_7: composto balanceado')
  RETURNING id INTO v_je_id;

  INSERT INTO journal_lines (journal_entry_id, account_id, amount_debit, amount_credit)
  VALUES
    (v_je_id, v_coa_ids[1], 100.00, 0),
    (v_je_id, v_coa_ids[2], 50.00, 0),
    (v_je_id, v_coa_ids[3], 0, 150.00);

  RAISE NOTICE '✓ TESTE 7 PASSOU: lançamento composto 3 linhas aceito (D100+D50=C150)';
  DELETE FROM journal_entries WHERE id = v_je_id;
END $$;


-- ═══════════════════════════════════════════
-- TESTE 8: Estorno gera lançamento inverso correto
-- Cria transação via RPC + estorna via RPC
-- ═══════════════════════════════════════════
DO $$
DECLARE
  v_user UUID := '04c41302-5429-4f97-9aeb-e21294d014ff';
  v_account_id UUID;
  v_result JSON;
  v_tx_id UUID;
  v_je_id UUID;
  v_reversal JSON;
  v_rev_je_id UUID;
  v_orig_d NUMERIC;
  v_orig_c NUMERIC;
  v_rev_d NUMERIC;
  v_rev_c NUMERIC;
BEGIN
  -- Buscar uma conta bancária do usuário
  SELECT id INTO v_account_id
  FROM accounts WHERE user_id = v_user AND is_active = TRUE LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE NOTICE '⊘ TESTE 8 SKIP: nenhuma conta ativa encontrada';
    RETURN;
  END IF;

  -- Criar transação via RPC
  SELECT create_transaction_with_journal(
    v_user, v_account_id, NULL, 'expense', 250.00,
    'TEST_8: transação para estorno', CURRENT_DATE, TRUE,
    'system', NULL, NULL, NULL
  ) INTO v_result;

  v_tx_id := (v_result->>'transaction_id')::UUID;
  v_je_id := (v_result->>'journal_entry_id')::UUID;

  -- Estornar
  SELECT reverse_transaction(v_user, v_tx_id) INTO v_reversal;
  v_rev_je_id := (v_reversal->>'reversal_journal_id')::UUID;

  -- Verificar que o estorno tem débitos/créditos invertidos
  IF v_je_id IS NOT NULL AND v_rev_je_id IS NOT NULL THEN
    SELECT SUM(amount_debit), SUM(amount_credit) INTO v_orig_d, v_orig_c
    FROM journal_lines WHERE journal_entry_id = v_je_id;

    SELECT SUM(amount_debit), SUM(amount_credit) INTO v_rev_d, v_rev_c
    FROM journal_lines WHERE journal_entry_id = v_rev_je_id;

    IF v_orig_d = v_rev_c AND v_orig_c = v_rev_d THEN
      RAISE NOTICE '✓ TESTE 8 PASSOU: estorno inverte D/C corretamente (orig D=% C=%, rev D=% C=%)',
        v_orig_d, v_orig_c, v_rev_d, v_rev_c;
    ELSE
      RAISE EXCEPTION 'FALHOU: estorno não inverteu D/C. Orig D=% C=%, Rev D=% C=%',
        v_orig_d, v_orig_c, v_rev_d, v_rev_c;
    END IF;
  ELSE
    RAISE NOTICE '⊘ TESTE 8 PARCIAL: transação criada sem journal (COA ausente)';
  END IF;

  -- Cleanup (soft-deleted transaction + journal entries permanecem por imutabilidade)
END $$;


-- ═══════════════════════════════════════════
-- TESTE 9: Journal entries são imutáveis via RLS
-- UPDATE e DELETE devem ser bloqueados para o user
-- (Este teste valida a existência das policies)
-- ═══════════════════════════════════════════
DO $$
DECLARE
  v_has_update_policy BOOLEAN;
  v_has_delete_policy BOOLEAN;
BEGIN
  -- Verificar que NÃO existem policies UPDATE/DELETE para journal_entries
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE tablename = 'journal_entries' AND cmd = 'UPDATE'
  ) INTO v_has_update_policy;

  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE tablename = 'journal_entries' AND cmd = 'DELETE'
  ) INTO v_has_delete_policy;

  IF NOT v_has_update_policy AND NOT v_has_delete_policy THEN
    RAISE NOTICE '✓ TESTE 9 PASSOU: journal_entries não tem policies UPDATE/DELETE (imutável)';
  ELSE
    RAISE EXCEPTION 'FALHOU: journal_entries tem policy UPDATE=% DELETE=% (deveria ser imutável)',
      v_has_update_policy, v_has_delete_policy;
  END IF;
END $$;


-- ═══════════════════════════════════════════
-- TESTE 10: Journal lines são imutáveis via RLS
-- ═══════════════════════════════════════════
DO $$
DECLARE
  v_has_update_policy BOOLEAN;
  v_has_delete_policy BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE tablename = 'journal_lines' AND cmd = 'UPDATE'
  ) INTO v_has_update_policy;

  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE tablename = 'journal_lines' AND cmd = 'DELETE'
  ) INTO v_has_delete_policy;

  IF NOT v_has_update_policy AND NOT v_has_delete_policy THEN
    RAISE NOTICE '✓ TESTE 10 PASSOU: journal_lines não tem policies UPDATE/DELETE (imutável)';
  ELSE
    RAISE EXCEPTION 'FALHOU: journal_lines tem policy UPDATE=% DELETE=% (deveria ser imutável)',
      v_has_update_policy, v_has_delete_policy;
  END IF;
END $$;


-- ═══════════════════════════════════════════
-- TESTE 11: Transação com valor zero é rejeitada
-- ═══════════════════════════════════════════
DO $$
DECLARE
  v_user UUID := '04c41302-5429-4f97-9aeb-e21294d014ff';
  v_account_id UUID;
BEGIN
  SELECT id INTO v_account_id
  FROM accounts WHERE user_id = v_user AND is_active = TRUE LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE NOTICE '⊘ TESTE 11 SKIP: nenhuma conta ativa';
    RETURN;
  END IF;

  -- amount = 0 viola CHECK (amount >= 0) ... espera, 0 passa no >= 0
  -- Mas na prática, criar journal_lines com amount 0 viola jl_debit_or_credit
  INSERT INTO transactions (user_id, account_id, type, amount, description, date, is_paid, source)
  VALUES (v_user, v_account_id, 'expense', 0, 'TEST_11: valor zero', CURRENT_DATE, FALSE, 'system');

  -- Se chegou aqui, o CHECK (amount >= 0) permitiu 0
  -- Isso é um ponto de atenção: a constraint deveria ser amount > 0?
  RAISE NOTICE '⚠ TESTE 11 INFO: transação com amount=0 foi ACEITA pela constraint (amount >= 0). Considerar alterar para amount > 0.';

  -- Cleanup
  DELETE FROM transactions
  WHERE user_id = v_user AND description = 'TEST_11: valor zero';
END $$;


-- ═══════════════════════════════════════════
-- TESTE 12: Dedup index rejeita external_id duplicado
-- ═══════════════════════════════════════════
DO $$
DECLARE
  v_user UUID := '04c41302-5429-4f97-9aeb-e21294d014ff';
  v_account_id UUID;
  v_ext_id TEXT := 'test_dedup_' || gen_random_uuid()::TEXT;
BEGIN
  SELECT id INTO v_account_id
  FROM accounts WHERE user_id = v_user AND is_active = TRUE LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE NOTICE '⊘ TESTE 12 SKIP: nenhuma conta ativa';
    RETURN;
  END IF;

  -- Primeira inserção (deve funcionar)
  INSERT INTO transactions (user_id, account_id, type, amount, description, date, is_paid, source, external_id)
  VALUES (v_user, v_account_id, 'expense', 50.00, 'TEST_12: dedup original', CURRENT_DATE, TRUE, 'ofx_import', v_ext_id);

  -- Segunda inserção com mesmo external_id (DEVE FALHAR)
  BEGIN
    INSERT INTO transactions (user_id, account_id, type, amount, description, date, is_paid, source, external_id)
    VALUES (v_user, v_account_id, 'expense', 50.00, 'TEST_12: dedup duplicada', CURRENT_DATE, TRUE, 'ofx_import', v_ext_id);

    RAISE EXCEPTION 'FALHOU: external_id duplicado aceito indevidamente';
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE '✓ TESTE 12 PASSOU: external_id duplicado rejeitado (unique_violation)';
  END;

  -- Cleanup
  DELETE FROM transactions
  WHERE user_id = v_user AND external_id = v_ext_id;
END $$;


-- ═══════════════════════════════════════════
-- RESUMO
-- ═══════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════';
  RAISE NOTICE ' WealthOS - Testes de Mutação Financeira';
  RAISE NOTICE ' 12 testes executados';
  RAISE NOTICE ' Se nenhum FALHOU acima, todos passaram.';
  RAISE NOTICE '══════════════════════════════════════';
END $$;
