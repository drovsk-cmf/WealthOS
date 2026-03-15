-- ============================================================
-- Oniefy - Seed de dados realistas (dev/demo)
-- Perfil: The Hybrid Earner (CLT + PJ + investimentos)
-- Uso: executar no SQL Editor do Supabase após onboarding
-- IMPORTANTE: substitua _uid pelo user_id real se diferente
-- ============================================================

DO $$
DECLARE
  _uid uuid := '04c41302-5429-4f97-9aeb-e21294d014ff';
  -- Accounts
  _acc_bb uuid := gen_random_uuid();      -- Conta corrente BB
  _acc_nu uuid := gen_random_uuid();      -- Cartão Nubank
  _acc_xp uuid := gen_random_uuid();      -- Investimentos XP
  _acc_poup uuid := gen_random_uuid();    -- Poupança
  _acc_fin uuid := gen_random_uuid();     -- Financiamento imóvel
  -- Categories (from existing seeds - IDs from the database)
  _cat_salario uuid := 'fcb96f82-2be2-47c4-9144-408b98d9b2e3';
  _cat_freelance uuid := 'b5902ff5-f36a-4e9a-9edb-1bc7bbaa79ed';
  _cat_rendimentos uuid := 'ad1a5975-b45e-4649-ac76-c53e24942dea';
  _cat_alimentacao uuid := '02c820f2-2400-4e61-9b67-fab5d2291487';
  _cat_moradia uuid := '9512a6c4-aa12-42a4-bc3b-da50d82840d6';
  _cat_transporte uuid := '298c262d-32da-4a33-963c-22a6181a27fa';
  _cat_saude uuid := 'cbbbe859-61eb-43d2-b968-016c88a79958';
  _cat_lazer uuid := '22ab4bdf-3230-447c-91a1-82a83d9059ed';
  _cat_educacao uuid := '007a2810-6b1d-4cd6-8cfe-70f9fd76544f';
  _cat_servicos uuid := '954f80b3-5789-4bc8-97a7-a09e4eb7915c';
  _cat_impostos uuid := 'a699ea82-cf84-4f61-9dbb-0044c03f605f';
  _cat_vestuario uuid := '66d1429e-bc12-4245-8695-0394d1d5faf2';
  _cat_outros_desp uuid := 'c893a2a0-3535-4877-8e82-455f45031ef6';
  -- Dates
  _today date := current_date;
  _m0 date := date_trunc('month', current_date)::date;          -- início mês atual
  _m1 date := (_m0 - interval '1 month')::date;                 -- início mês anterior
  _m2 date := (_m0 - interval '2 months')::date;                -- início 2 meses atrás
BEGIN

  -- ──────────────────────────────────────────────────────
  -- 1. ACCOUNTS (5 contas)
  -- ──────────────────────────────────────────────────────

  INSERT INTO public.accounts (id, user_id, name, type, initial_balance, current_balance, projected_balance, color, liquidity_tier) VALUES
    (_acc_bb,   _uid, 'Conta Corrente',     'checking',    15000, 18450.75, 16250.75, '#1E3A5F', 'T1'),
    (_acc_nu,   _uid, 'Cartão de Crédito',  'credit_card', 0,    -3245.60, -4890.30, '#820AD1', 'T1'),
    (_acc_xp,   _uid, 'Investimentos',      'investment',  50000, 62340.00, 62340.00, '#FFB800', 'T2'),
    (_acc_poup, _uid, 'Reserva Emergência', 'savings',     20000, 24150.00, 24150.00, '#2F7A68', 'T1'),
    (_acc_fin,  _uid, 'Financiamento Imóvel','financing',   0,   -285000,  -285000,   '#A64A45', 'T4');

  -- ──────────────────────────────────────────────────────
  -- 2. TRANSACTIONS (últimos 3 meses, ~60 transações)
  -- ──────────────────────────────────────────────────────

  -- ── Mês -2 (2 meses atrás) ───────────────────────────

  -- Receitas
  INSERT INTO public.transactions (user_id, account_id, category_id, type, amount, description, date, is_paid, source, payment_status) VALUES
    (_uid, _acc_bb, _cat_salario,    'income',  12500, 'Salário CLT Empresa A',      _m2 + 5,  true, 'manual', 'paid'),
    (_uid, _acc_bb, _cat_freelance,  'income',  4200,  'NF Consultoria Cliente B',   _m2 + 12, true, 'manual', 'paid'),
    (_uid, _acc_bb, _cat_rendimentos,'income',  520,   'Rendimentos CDB XP',         _m2 + 1,  true, 'manual', 'paid');

  -- Despesas
  INSERT INTO public.transactions (user_id, account_id, category_id, type, amount, description, date, is_paid, source, payment_status) VALUES
    (_uid, _acc_bb,  _cat_moradia,     'expense', 2800, 'Aluguel apartamento',         _m2 + 5,  true, 'manual', 'paid'),
    (_uid, _acc_bb,  _cat_moradia,     'expense', 380,  'Condomínio',                  _m2 + 10, true, 'manual', 'paid'),
    (_uid, _acc_bb,  _cat_moradia,     'expense', 195,  'Conta de luz',                _m2 + 15, true, 'manual', 'paid'),
    (_uid, _acc_bb,  _cat_moradia,     'expense', 89,   'Internet fibra',              _m2 + 8,  true, 'manual', 'paid'),
    (_uid, _acc_nu,  _cat_alimentacao, 'expense', 1850, 'Supermercado (vários)',        _m2 + 3,  true, 'manual', 'paid'),
    (_uid, _acc_nu,  _cat_alimentacao, 'expense', 620,  'Restaurantes e delivery',     _m2 + 7,  true, 'manual', 'paid'),
    (_uid, _acc_bb,  _cat_transporte,  'expense', 450,  'Combustível',                 _m2 + 4,  true, 'manual', 'paid'),
    (_uid, _acc_bb,  _cat_transporte,  'expense', 180,  'Estacionamento',              _m2 + 14, true, 'manual', 'paid'),
    (_uid, _acc_nu,  _cat_saude,       'expense', 890,  'Plano de saúde',              _m2 + 1,  true, 'manual', 'paid'),
    (_uid, _acc_nu,  _cat_educacao,    'expense', 350,  'Curso online Udemy',          _m2 + 20, true, 'manual', 'paid'),
    (_uid, _acc_bb,  _cat_impostos,    'expense', 1100, 'DARF IRPF complementar',      _m2 + 25, true, 'manual', 'paid'),
    (_uid, _acc_bb,  _cat_impostos,    'expense', 650,  'ISS retido PJ',               _m2 + 15, true, 'manual', 'paid'),
    (_uid, _acc_nu,  _cat_lazer,       'expense', 280,  'Streaming + Spotify',         _m2 + 1,  true, 'manual', 'paid'),
    (_uid, _acc_bb,  _cat_servicos,    'expense', 150,  'Contador PJ',                 _m2 + 10, true, 'manual', 'paid'),
    (_uid, _acc_bb,  _cat_moradia,     'expense', 2850, 'Parcela financiamento',       _m2 + 15, true, 'manual', 'paid');

  -- ── Mês -1 (mês anterior) ────────────────────────────

  INSERT INTO public.transactions (user_id, account_id, category_id, type, amount, description, date, is_paid, source, payment_status) VALUES
    (_uid, _acc_bb, _cat_salario,    'income',  12500, 'Salário CLT Empresa A',      _m1 + 5,  true, 'manual', 'paid'),
    (_uid, _acc_bb, _cat_freelance,  'income',  5800,  'NF Consultoria Cliente B',   _m1 + 10, true, 'manual', 'paid'),
    (_uid, _acc_bb, _cat_freelance,  'income',  2200,  'NF Projeto avulso Cliente C', _m1 + 22, true, 'manual', 'paid'),
    (_uid, _acc_bb, _cat_rendimentos,'income',  540,   'Rendimentos CDB XP',         _m1 + 1,  true, 'manual', 'paid');

  INSERT INTO public.transactions (user_id, account_id, category_id, type, amount, description, date, is_paid, source, payment_status) VALUES
    (_uid, _acc_bb,  _cat_moradia,     'expense', 2800, 'Aluguel apartamento',         _m1 + 5,  true, 'manual', 'paid'),
    (_uid, _acc_bb,  _cat_moradia,     'expense', 380,  'Condomínio',                  _m1 + 10, true, 'manual', 'paid'),
    (_uid, _acc_bb,  _cat_moradia,     'expense', 210,  'Conta de luz',                _m1 + 15, true, 'manual', 'paid'),
    (_uid, _acc_bb,  _cat_moradia,     'expense', 89,   'Internet fibra',              _m1 + 8,  true, 'manual', 'paid'),
    (_uid, _acc_nu,  _cat_alimentacao, 'expense', 2100, 'Supermercado (vários)',        _m1 + 2,  true, 'manual', 'paid'),
    (_uid, _acc_nu,  _cat_alimentacao, 'expense', 780,  'Restaurantes e delivery',     _m1 + 9,  true, 'manual', 'paid'),
    (_uid, _acc_bb,  _cat_transporte,  'expense', 520,  'Combustível',                 _m1 + 6,  true, 'manual', 'paid'),
    (_uid, _acc_bb,  _cat_transporte,  'expense', 160,  'Uber/99',                     _m1 + 18, true, 'manual', 'paid'),
    (_uid, _acc_nu,  _cat_saude,       'expense', 890,  'Plano de saúde',              _m1 + 1,  true, 'manual', 'paid'),
    (_uid, _acc_nu,  _cat_saude,       'expense', 350,  'Dentista',                    _m1 + 14, true, 'manual', 'paid'),
    (_uid, _acc_bb,  _cat_impostos,    'expense', 1100, 'DARF IRPF complementar',      _m1 + 25, true, 'manual', 'paid'),
    (_uid, _acc_bb,  _cat_impostos,    'expense', 720,  'ISS retido PJ',               _m1 + 15, true, 'manual', 'paid'),
    (_uid, _acc_nu,  _cat_lazer,       'expense', 280,  'Streaming + Spotify',         _m1 + 1,  true, 'manual', 'paid'),
    (_uid, _acc_nu,  _cat_lazer,       'expense', 450,  'Jantar aniversário',          _m1 + 20, true, 'manual', 'paid'),
    (_uid, _acc_bb,  _cat_servicos,    'expense', 150,  'Contador PJ',                 _m1 + 10, true, 'manual', 'paid'),
    (_uid, _acc_bb,  _cat_moradia,     'expense', 2850, 'Parcela financiamento',       _m1 + 15, true, 'manual', 'paid'),
    (_uid, _acc_nu,  _cat_vestuario,   'expense', 680,  'Roupas inverno',              _m1 + 12, true, 'manual', 'paid');

  -- ── Mês atual ─────────────────────────────────────────

  INSERT INTO public.transactions (user_id, account_id, category_id, type, amount, description, date, is_paid, source, payment_status) VALUES
    (_uid, _acc_bb, _cat_salario,    'income',  12500, 'Salário CLT Empresa A',      _m0 + 5,  true,  'manual', 'paid'),
    (_uid, _acc_bb, _cat_freelance,  'income',  3500,  'NF Consultoria Cliente B',   _m0 + 8,  true,  'manual', 'paid'),
    (_uid, _acc_bb, _cat_rendimentos,'income',  560,   'Rendimentos CDB XP',         _m0 + 1,  true,  'manual', 'paid');

  INSERT INTO public.transactions (user_id, account_id, category_id, type, amount, description, date, is_paid, source, payment_status) VALUES
    (_uid, _acc_bb,  _cat_moradia,     'expense', 2800, 'Aluguel apartamento',         _m0 + 5,  true,  'manual', 'paid'),
    (_uid, _acc_bb,  _cat_moradia,     'expense', 380,  'Condomínio',                  _m0 + 10, true,  'manual', 'paid'),
    (_uid, _acc_bb,  _cat_moradia,     'expense', 89,   'Internet fibra',              _m0 + 8,  true,  'manual', 'paid'),
    (_uid, _acc_nu,  _cat_alimentacao, 'expense', 1450, 'Supermercado (vários)',        _m0 + 3,  true,  'manual', 'paid'),
    (_uid, _acc_nu,  _cat_alimentacao, 'expense', 320,  'iFood e Rappi',               _m0 + 7,  true,  'manual', 'paid'),
    (_uid, _acc_bb,  _cat_transporte,  'expense', 380,  'Combustível',                 _m0 + 4,  true,  'manual', 'paid'),
    (_uid, _acc_nu,  _cat_saude,       'expense', 890,  'Plano de saúde',              _m0 + 1,  true,  'manual', 'paid'),
    (_uid, _acc_nu,  _cat_lazer,       'expense', 280,  'Streaming + Spotify',         _m0 + 1,  true,  'manual', 'paid'),
    (_uid, _acc_bb,  _cat_moradia,     'expense', 2850, 'Parcela financiamento',       _m0 + 15, false, 'manual', 'pending'),
    (_uid, _acc_bb,  _cat_impostos,    'expense', 1100, 'DARF IRPF complementar',      _m0 + 25, false, 'manual', 'pending');

  -- Transações sem categoria (para fila de atenção)
  INSERT INTO public.transactions (user_id, account_id, category_id, type, amount, description, date, is_paid, source, payment_status) VALUES
    (_uid, _acc_nu,  NULL, 'expense', 156.90, 'PIX Recebido',             _m0 + 6,  true, 'manual', 'paid'),
    (_uid, _acc_nu,  NULL, 'expense', 89.90,  'Compra online',            _m0 + 9,  true, 'manual', 'paid'),
    (_uid, _acc_bb,  NULL, 'expense', 245.00, 'TED Recebido',             _m0 + 11, true, 'manual', 'paid');

  -- ──────────────────────────────────────────────────────
  -- 3. BUDGETS (mês atual)
  -- ──────────────────────────────────────────────────────

  INSERT INTO public.budgets (user_id, category_id, month, planned_amount, alert_threshold) VALUES
    (_uid, _cat_alimentacao, _m0, 3000, 80),
    (_uid, _cat_moradia,     _m0, 6500, 80),
    (_uid, _cat_transporte,  _m0, 800,  80),
    (_uid, _cat_saude,       _m0, 1500, 80),
    (_uid, _cat_lazer,       _m0, 500,  80),
    (_uid, _cat_educacao,    _m0, 500,  80),
    (_uid, _cat_impostos,    _m0, 2000, 90),
    (_uid, _cat_servicos,    _m0, 300,  80);

  -- ──────────────────────────────────────────────────────
  -- 4. ASSETS (patrimônio)
  -- ──────────────────────────────────────────────────────

  INSERT INTO public.assets (user_id, name, category, acquisition_date, acquisition_value, current_value, depreciation_rate) VALUES
    (_uid, 'Apartamento 72m2',       'real_estate',  '2022-03-15', 420000,  450000, 0),
    (_uid, 'SUV Compacto 2023',      'vehicle',      '2023-06-01', 115000,  95000,  15),
    (_uid, 'MacBook Pro 14" M3',     'electronics',  '2024-01-10', 18000,   13500,  20),
    (_uid, 'Relógio automático',     'other',        '2021-11-20', 8500,    9200,   0);

  RAISE NOTICE 'Seed concluído: 5 contas, ~60 transações (3 meses), 8 orçamentos, 4 ativos.';
END $$;
