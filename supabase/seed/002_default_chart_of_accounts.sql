-- ============================================
-- WealthOS - Seed 002: Plano de Contas Semente
-- ============================================
-- Funcao create_default_chart_of_accounts(): 111 contas base
-- Funcao create_default_cost_center(): centro 'Pessoal'
-- Seed economic_indices_sources: mapeamento de fontes BCB/IBGE
-- Referencia: wealthos-estudo-contabil-v1.5-final
--
-- NOTA: O HANDOVER cita 133 contas (111 base + 22 subcontas de
-- investimentos/bens no Grupo 1.2). As 22 subcontas (depth 3,
-- ex: Renda Fixa, Renda Variavel, FIIs, Cripto sob 1.2.01)
-- devem ser adicionadas quando o detalhamento estiver disponivel.
-- O mecanismo is_active = false garante que aparecem sob demanda.
-- ============================================


-- Substitui o placeholder da migration 002
CREATE OR REPLACE FUNCTION create_default_chart_of_accounts(p_user_id UUID)
RETURNS void AS $$
DECLARE
  -- IDs dos grupos (depth 0) para referencia de parent_id
  v_g1 UUID; v_g2 UUID; v_g3 UUID; v_g4 UUID; v_g5 UUID;
  -- IDs dos subgrupos (depth 1)
  v_1_1 UUID; v_1_2 UUID; v_1_3 UUID;
  v_2_1 UUID; v_2_2 UUID;
  v_3_1 UUID;
  v_4_1 UUID; v_4_2 UUID; v_4_3 UUID;
  v_5_01 UUID; v_5_02 UUID; v_5_03 UUID; v_5_04 UUID; v_5_05 UUID;
  v_5_06 UUID; v_5_07 UUID; v_5_08 UUID; v_5_09 UUID; v_5_10 UUID;
  v_5_11 UUID; v_5_12 UUID; v_5_13 UUID; v_5_14 UUID; v_5_15 UUID;
  v_5_16 UUID; v_5_17 UUID; v_5_18 UUID; v_5_19 UUID;
BEGIN

  -- ========================================
  -- DEPTH 0: Grupos (5 grupos, sempre ativos)
  -- ========================================
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '1', 'Onde tenho dinheiro e bens', 'Ativo', 'asset', 0, TRUE, TRUE, 1)
  RETURNING id INTO v_g1;

  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '2', 'O que devo', 'Passivo', 'liability', 0, TRUE, TRUE, 2)
  RETURNING id INTO v_g2;

  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '3', 'Meu patrimonio', 'Patrimonio Liquido', 'equity', 0, TRUE, TRUE, 3)
  RETURNING id INTO v_g3;

  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '4', 'De onde vem', 'Receitas', 'revenue', 0, TRUE, TRUE, 4)
  RETURNING id INTO v_g4;

  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5', 'Para onde vai', 'Despesas', 'expense', 0, TRUE, TRUE, 5)
  RETURNING id INTO v_g5;


  -- ========================================
  -- DEPTH 1: Subgrupos (sempre ativos)
  -- ========================================

  -- Grupo 1: Ativo
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '1.1', 'Dinheiro disponivel', 'Ativo Circulante', 'asset', v_g1, 1, TRUE, TRUE, 1)
  RETURNING id INTO v_1_1;

  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '1.2', 'Bens e investimentos', 'Ativo Nao Circulante', 'asset', v_g1, 1, TRUE, TRUE, 2)
  RETURNING id INTO v_1_2;

  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '1.3', 'Valores a receber', 'Creditos a Receber', 'asset', v_g1, 1, TRUE, TRUE, 3)
  RETURNING id INTO v_1_3;

  -- Grupo 2: Passivo
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '2.1', 'Dividas de curto prazo', 'Passivo Circulante', 'liability', v_g2, 1, TRUE, TRUE, 1)
  RETURNING id INTO v_2_1;

  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '2.2', 'Dividas de longo prazo', 'Passivo Nao Circulante', 'liability', v_g2, 1, TRUE, TRUE, 2)
  RETURNING id INTO v_2_2;

  -- Grupo 3: PL
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '3.1', 'Patrimonio', 'Patrimonio Liquido', 'equity', v_g3, 1, TRUE, TRUE, 1)
  RETURNING id INTO v_3_1;

  -- Grupo 4: Receitas
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '4.1', 'Renda principal', 'Receitas de Trabalho', 'revenue', v_g4, 1, TRUE, TRUE, 1)
  RETURNING id INTO v_4_1;

  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '4.2', 'Renda do patrimonio', 'Receitas de Patrimonio', 'revenue', v_g4, 1, TRUE, TRUE, 2)
  RETURNING id INTO v_4_2;

  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '4.3', 'Outras entradas', 'Outras Receitas', 'revenue', v_g4, 1, TRUE, TRUE, 3)
  RETURNING id INTO v_4_3;

  -- Grupo 5: Despesas (19 subcategorias)
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.01', 'Casa', 'Moradia', 'expense', v_g5, 1, TRUE, TRUE, 1) RETURNING id INTO v_5_01;
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.02', 'Telecom e internet', 'Conectividade e Comunicacoes', 'expense', v_g5, 1, TRUE, TRUE, 2) RETURNING id INTO v_5_02;
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.03', 'Equipar a casa', 'Casa e Equipamentos', 'expense', v_g5, 1, TRUE, TRUE, 3) RETURNING id INTO v_5_03;
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.04', 'Obras e reformas', 'Reformas e Construcao', 'expense', v_g5, 1, TRUE, TRUE, 4) RETURNING id INTO v_5_04;
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.05', 'Alimentacao', 'Alimentacao', 'expense', v_g5, 1, TRUE, TRUE, 5) RETURNING id INTO v_5_05;
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.06', 'Saude', 'Saude', 'expense', v_g5, 1, TRUE, TRUE, 6) RETURNING id INTO v_5_06;
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.07', 'Cuidados pessoais', 'Cuidados Pessoais e Bem-Estar', 'expense', v_g5, 1, TRUE, TRUE, 7) RETURNING id INTO v_5_07;
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.08', 'Transporte', 'Transporte e Mobilidade', 'expense', v_g5, 1, TRUE, TRUE, 8) RETURNING id INTO v_5_08;
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.09', 'Educacao', 'Educacao', 'expense', v_g5, 1, TRUE, TRUE, 9) RETURNING id INTO v_5_09;
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.10', 'Lazer e entretenimento', 'Lazer e Entretenimento', 'expense', v_g5, 1, TRUE, TRUE, 10) RETURNING id INTO v_5_10;
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.11', 'Assinaturas digitais', 'Assinaturas Digitais', 'expense', v_g5, 1, TRUE, TRUE, 11) RETURNING id INTO v_5_11;
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.12', 'Roupas', 'Vestuario', 'expense', v_g5, 1, TRUE, TRUE, 12) RETURNING id INTO v_5_12;
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.13', 'Social e presentes', 'Social e Presentes', 'expense', v_g5, 1, TRUE, TRUE, 13) RETURNING id INTO v_5_13;
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.14', 'Casa - servicos', 'Servicos Domesticos', 'expense', v_g5, 1, TRUE, TRUE, 14) RETURNING id INTO v_5_14;
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.15', 'Pet', 'Animais de Estimacao', 'expense', v_g5, 1, TRUE, TRUE, 15) RETURNING id INTO v_5_15;
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.16', 'Seguros', 'Seguros', 'expense', v_g5, 1, TRUE, TRUE, 16) RETURNING id INTO v_5_16;
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.17', 'Impostos e tributos', 'Impostos e Tributos', 'expense', v_g5, 1, TRUE, TRUE, 17) RETURNING id INTO v_5_17;
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.18', 'Custos financeiros', 'Despesas Financeiras', 'expense', v_g5, 1, TRUE, TRUE, 18) RETURNING id INTO v_5_18;
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order)
  VALUES (p_user_id, '5.19', 'Outras despesas', 'Outras Despesas', 'expense', v_g5, 1, TRUE, TRUE, 19) RETURNING id INTO v_5_19;


  -- ========================================
  -- DEPTH 2: Contas folha (is_active = false, ativam por uso)
  -- Formato: (user_id, code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order)
  -- ========================================

  -- Grupo 1.1: Ativo Circulante
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order) VALUES
    (p_user_id, '1.1.01', 'Contas correntes',            'Bancos Conta Corrente',            'asset', v_1_1, 2, TRUE, FALSE, 1),
    (p_user_id, '1.1.02', 'Poupancas',                   'Bancos Conta Poupanca',            'asset', v_1_1, 2, TRUE, FALSE, 2),
    (p_user_id, '1.1.03', 'Carteiras digitais',          'Carteiras Digitais',               'asset', v_1_1, 2, TRUE, FALSE, 3),
    (p_user_id, '1.1.04', 'Investimentos de curto prazo', 'Aplicacoes de Liquidez Imediata', 'asset', v_1_1, 2, TRUE, FALSE, 4),
    (p_user_id, '1.1.05', 'Antecipacao de despesas',     'Despesas Antecipadas',             'asset', v_1_1, 2, TRUE, FALSE, 5);

  -- Grupo 1.2: Ativo Nao Circulante
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order) VALUES
    (p_user_id, '1.2.01', 'Investimentos',              'Investimentos de Longo Prazo',   'asset', v_1_2, 2, TRUE, FALSE, 1),
    (p_user_id, '1.2.02', 'Imoveis',                    'Imoveis',                        'asset', v_1_2, 2, TRUE, FALSE, 2),
    (p_user_id, '1.2.03', 'Veiculos',                   'Veiculos',                       'asset', v_1_2, 2, TRUE, FALSE, 3),
    (p_user_id, '1.2.04', 'Joias, bolsas e relogios',   'Bens de Alta Liquidez',          'asset', v_1_2, 2, TRUE, FALSE, 4),
    (p_user_id, '1.2.05', 'Outros bens',                'Outros Bens Moveis',             'asset', v_1_2, 2, TRUE, FALSE, 5);

  -- Grupo 1.3: Creditos a Receber
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order) VALUES
    (p_user_id, '1.3.01', 'Emprestimos que fiz',  'Emprestimos Concedidos', 'asset', v_1_3, 2, TRUE, FALSE, 1),
    (p_user_id, '1.3.02', 'Outros a receber',     'Outros Creditos',        'asset', v_1_3, 2, TRUE, FALSE, 2);

  -- Grupo 2.1: Passivo Circulante
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order) VALUES
    (p_user_id, '2.1.01', 'Cartoes de credito',       'Cartoes de Credito',           'liability', v_2_1, 2, TRUE, FALSE, 1),
    (p_user_id, '2.1.02', 'Contas a pagar',           'Contas a Pagar',               'liability', v_2_1, 2, TRUE, FALSE, 2),
    (p_user_id, '2.1.03', 'Emprestimos (curto prazo)', 'Emprestimos de Curto Prazo',  'liability', v_2_1, 2, TRUE, FALSE, 3),
    (p_user_id, '2.1.04', 'Impostos pendentes',       'Impostos a Pagar',             'liability', v_2_1, 2, TRUE, FALSE, 4);

  -- Grupo 2.2: Passivo Nao Circulante
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order) VALUES
    (p_user_id, '2.2.01', 'Financiamento do imovel',   'Financiamento Imobiliario',    'liability', v_2_2, 2, TRUE, FALSE, 1),
    (p_user_id, '2.2.02', 'Financiamento do veiculo',  'Financiamento de Veiculos',    'liability', v_2_2, 2, TRUE, FALSE, 2),
    (p_user_id, '2.2.03', 'Emprestimos (longo prazo)', 'Emprestimos de Longo Prazo',   'liability', v_2_2, 2, TRUE, FALSE, 3);

  -- Grupo 3.1: Patrimonio Liquido
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, is_system, is_active, sort_order) VALUES
    (p_user_id, '3.1.01', 'Patrimonio acumulado',          'Capital Pessoal',        'equity', v_3_1, 2, TRUE, FALSE, 1),
    (p_user_id, '3.1.02', 'Reservas',                      'Reservas',               'equity', v_3_1, 2, TRUE, FALSE, 2),
    (p_user_id, '3.1.03', 'Transferencias entre membros',  'Aportes e Retiradas',    'equity', v_3_1, 2, TRUE, FALSE, 3);

  -- Grupo 4.1: Receitas de Trabalho
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '4.1.01', 'Salario / Rendimentos CLT',      'Rendimentos Individuais',      'revenue', v_4_1, 2, 'tributavel',     TRUE, FALSE, 1),
    (p_user_id, '4.1.02', 'Bonificacoes e premios',         'Bonificacoes e Premios',       'revenue', v_4_1, 2, 'tributavel',     TRUE, FALSE, 2),
    (p_user_id, '4.1.03', 'Receita PJ / Freelance',         'Rendimentos Pessoa Juridica',  'revenue', v_4_1, 2, 'tributavel',     TRUE, FALSE, 3),
    (p_user_id, '4.1.04', 'Dividendos e lucros distribuidos', 'Distribuicao de Lucros',     'revenue', v_4_1, 2, 'isento',         TRUE, FALSE, 4);

  -- Grupo 4.2: Receitas de Patrimonio
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '4.2.01', 'Rendimentos de investimentos', 'Receita de Investimentos', 'revenue', v_4_2, 2, 'exclusivo_fonte', TRUE, FALSE, 1),
    (p_user_id, '4.2.02', 'Alugueis',                     'Alugueis Recebidos',       'revenue', v_4_2, 2, 'tributavel',      TRUE, FALSE, 2),
    (p_user_id, '4.2.03', 'Ganhos de capital',             'Ganhos de Capital',        'revenue', v_4_2, 2, 'ganho_capital',   TRUE, FALSE, 3),
    (p_user_id, '4.2.04', 'Juros recebidos e outras',     'Receitas Financeiras',     'revenue', v_4_2, 2, 'exclusivo_fonte', TRUE, FALSE, 4);

  -- Grupo 4.3: Outras Receitas
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '4.3.01', 'Presentes recebidos', 'Presentes Recebidos', 'revenue', v_4_3, 2, 'isento',   TRUE, FALSE, 1),
    (p_user_id, '4.3.02', 'Outras receitas',     'Outras Receitas',     'revenue', v_4_3, 2, 'variavel', TRUE, FALSE, 2);


  -- ========================================
  -- GRUPO 5: DESPESAS (75 contas folha)
  -- ========================================

  -- 5.01 Moradia
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.01.01', 'Aluguel ou prestacao',         'Aluguel ou Prestacao',           'expense', v_5_01, 2, 'nao_dedutivel', TRUE, FALSE, 1),
    (p_user_id, '5.01.02', 'IPTU e taxas',                 'Tributacao Imobiliaria',         'expense', v_5_01, 2, 'nao_dedutivel', TRUE, FALSE, 2),
    (p_user_id, '5.01.03', 'Condominio',                   'Taxa de Condominio',             'expense', v_5_01, 2, 'nao_dedutivel', TRUE, FALSE, 3),
    (p_user_id, '5.01.04', 'Agua e esgoto',                'Agua e Esgoto',                  'expense', v_5_01, 2, 'nao_dedutivel', TRUE, FALSE, 4),
    (p_user_id, '5.01.05', 'Energia eletrica',             'Energia Eletrica',               'expense', v_5_01, 2, 'nao_dedutivel', TRUE, FALSE, 5),
    (p_user_id, '5.01.06', 'Gas',                          'Gas Residencial',                'expense', v_5_01, 2, 'nao_dedutivel', TRUE, FALSE, 6),
    (p_user_id, '5.01.07', 'Seguro residencial',           'Seguro e Franquia Residencial',  'expense', v_5_01, 2, 'nao_dedutivel', TRUE, FALSE, 7),
    (p_user_id, '5.01.08', 'Manutencao da casa',           'Manutencao Residencial',         'expense', v_5_01, 2, 'nao_dedutivel', TRUE, FALSE, 8);

  -- 5.02 Conectividade
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.02.01', 'Internet e dados',   'Servicos de Dados e Conectividade', 'expense', v_5_02, 2, 'nao_dedutivel', TRUE, FALSE, 1),
    (p_user_id, '5.02.02', 'TV a cabo',          'Assinatura de TV a Cabo',           'expense', v_5_02, 2, 'nao_dedutivel', TRUE, FALSE, 2),
    (p_user_id, '5.02.03', 'Telefone fixo',      'Telefonia Fixa',                    'expense', v_5_02, 2, 'nao_dedutivel', TRUE, FALSE, 3),
    (p_user_id, '5.02.04', 'Celular',            'Telefonia Movel',                   'expense', v_5_02, 2, 'nao_dedutivel', TRUE, FALSE, 4);

  -- 5.03 Casa e Equipamentos
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.03.01', 'Eletrodomesticos e moveis',  'Eletrodomesticos, Moveis e Utensilios', 'expense', v_5_03, 2, 'nao_dedutivel', TRUE, FALSE, 1),
    (p_user_id, '5.03.02', 'Eletronicos e tecnologia',   'Eletronicos e Tecnologia',              'expense', v_5_03, 2, 'nao_dedutivel', TRUE, FALSE, 2),
    (p_user_id, '5.03.03', 'Decoracao',                  'Decoracao e Acessorios',                'expense', v_5_03, 2, 'nao_dedutivel', TRUE, FALSE, 3),
    (p_user_id, '5.03.04', 'Cama, mesa e banho',         'Cama, Mesa e Banho',                    'expense', v_5_03, 2, 'nao_dedutivel', TRUE, FALSE, 4),
    (p_user_id, '5.03.05', 'Ferramentas',                'Ferramentas e Mecanismos',              'expense', v_5_03, 2, 'nao_dedutivel', TRUE, FALSE, 5);

  -- 5.04 Reformas e Construcao
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.04.01', 'Servicos de reforma',       'Servicos de Reforma e Construcao',      'expense', v_5_04, 2, 'nao_dedutivel', TRUE, FALSE, 1),
    (p_user_id, '5.04.02', 'Engenharia e arquitetura',  'Servicos de Engenharia e Arquitetura',  'expense', v_5_04, 2, 'nao_dedutivel', TRUE, FALSE, 2),
    (p_user_id, '5.04.03', 'Materiais de obra',         'Materiais e Insumos de Obra',           'expense', v_5_04, 2, 'nao_dedutivel', TRUE, FALSE, 3),
    (p_user_id, '5.04.04', 'Loucas e metais',           'Cubas, Loucas, Metais e Outros',        'expense', v_5_04, 2, 'nao_dedutivel', TRUE, FALSE, 4);

  -- 5.05 Alimentacao
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.05.01', 'Mercado e provisoes',    'Mercado, Provisoes e Outros',    'expense', v_5_05, 2, 'nao_dedutivel', TRUE, FALSE, 1),
    (p_user_id, '5.05.02', 'Refeicoes',              'Refeicoes Regulares',            'expense', v_5_05, 2, 'nao_dedutivel', TRUE, FALSE, 2),
    (p_user_id, '5.05.03', 'Delivery e conveniencia', 'Food Delivery e Conveniencia', 'expense', v_5_05, 2, 'nao_dedutivel', TRUE, FALSE, 3),
    (p_user_id, '5.05.04', 'Lanches e bebidas',      'Lanches, Bebidas e Outros',      'expense', v_5_05, 2, 'nao_dedutivel', TRUE, FALSE, 4),
    (p_user_id, '5.05.05', 'Gastronomia',            'Gastronomia e Experiencias',     'expense', v_5_05, 2, 'nao_dedutivel', TRUE, FALSE, 5);

  -- 5.06 Saude
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.06.01', 'Plano de saude',           'Plano de Saude',                       'expense', v_5_06, 2, 'dedutivel_integral', TRUE, FALSE, 1),
    (p_user_id, '5.06.02', 'Coparticipacao',           'Coparticipacao Plano de Saude',        'expense', v_5_06, 2, 'dedutivel_integral', TRUE, FALSE, 2),
    (p_user_id, '5.06.03', 'Medicamentos',             'Medicamentos e Insumos',               'expense', v_5_06, 2, 'nao_dedutivel',      TRUE, FALSE, 3),
    (p_user_id, '5.06.04', 'Medicos e exames',         'Servicos Medicos, Exames e Vacinas',   'expense', v_5_06, 2, 'dedutivel_integral', TRUE, FALSE, 4),
    (p_user_id, '5.06.05', 'Dentista',                 'Servicos Odontologicos e Exames',      'expense', v_5_06, 2, 'dedutivel_integral', TRUE, FALSE, 5),
    (p_user_id, '5.06.06', 'Psicologia e fono',        'Psicologia e Fonoaudiologia',          'expense', v_5_06, 2, 'dedutivel_integral', TRUE, FALSE, 6),
    (p_user_id, '5.06.07', 'Fisioterapia e acupuntura', 'Fisioterapia e Acupuntura',           'expense', v_5_06, 2, 'dedutivel_integral', TRUE, FALSE, 7),
    (p_user_id, '5.06.08', 'Dermatologia',             'Tratamentos Dermatologicos',           'expense', v_5_06, 2, 'dedutivel_integral', TRUE, FALSE, 8);

  -- 5.07 Cuidados Pessoais
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.07.01', 'Cosmeticos e perfumaria', 'Cosmeticos e Perfumaria',                    'expense', v_5_07, 2, 'nao_dedutivel', TRUE, FALSE, 1),
    (p_user_id, '5.07.02', 'Barbearia',               'Servicos de Barbearia',                      'expense', v_5_07, 2, 'nao_dedutivel', TRUE, FALSE, 2),
    (p_user_id, '5.07.03', 'Spa e cuidados pessoais', 'Servicos de Spa e Cuidados Pessoais',        'expense', v_5_07, 2, 'nao_dedutivel', TRUE, FALSE, 3),
    (p_user_id, '5.07.04', 'Esportes e academia',     'Esportes, Atividades Fisicas e Equipamentos', 'expense', v_5_07, 2, 'nao_dedutivel', TRUE, FALSE, 4);

  -- 5.08 Transporte
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.08.01', 'Combustivel',               'Combustivel e Carregamento Eletrico',  'expense', v_5_08, 2, 'nao_dedutivel', TRUE, FALSE, 1),
    (p_user_id, '5.08.02', 'Estacionamento e pedagios',  'Estacionamento e Pedagios',           'expense', v_5_08, 2, 'nao_dedutivel', TRUE, FALSE, 2),
    (p_user_id, '5.08.03', 'Manutencao de veiculos',    'Manutencao de Veiculos',               'expense', v_5_08, 2, 'nao_dedutivel', TRUE, FALSE, 3),
    (p_user_id, '5.08.04', 'Seguro veicular',           'Seguro e Franquia de Veiculos',        'expense', v_5_08, 2, 'nao_dedutivel', TRUE, FALSE, 4),
    (p_user_id, '5.08.05', 'IPVA e licenciamento',      'IPVA e Licenciamento',                 'expense', v_5_08, 2, 'nao_dedutivel', TRUE, FALSE, 5),
    (p_user_id, '5.08.06', 'Taxi e apps',               'Taxi e Apps de Mobilidade',            'expense', v_5_08, 2, 'nao_dedutivel', TRUE, FALSE, 6),
    (p_user_id, '5.08.07', 'Outras despesas de mobilidade', 'Despesas Gerais de Mobilidade',    'expense', v_5_08, 2, 'nao_dedutivel', TRUE, FALSE, 7);

  -- 5.09 Educacao
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.09.01', 'Escola e faculdade',          'Educacao Basica, Tecnica e Superior',  'expense', v_5_09, 2, 'dedutivel_limitado', TRUE, FALSE, 1),
    (p_user_id, '5.09.02', 'Cursos extras',               'Cursos Extracurriculares e Outros',    'expense', v_5_09, 2, 'nao_dedutivel',      TRUE, FALSE, 2),
    (p_user_id, '5.09.03', 'Livros e assinaturas',        'Livros, Periodicos e Assinaturas',     'expense', v_5_09, 2, 'nao_dedutivel',      TRUE, FALSE, 3);

  -- 5.10 Lazer e Entretenimento
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.10.01', 'Teatro, cinema e shows',  'Teatro, Cinema e Shows',              'expense', v_5_10, 2, 'nao_dedutivel', TRUE, FALSE, 1),
    (p_user_id, '5.10.02', 'Viagens e turismo',       'Viagens e Turismo',                   'expense', v_5_10, 2, 'nao_dedutivel', TRUE, FALSE, 2),
    (p_user_id, '5.10.03', 'Passagens e hospedagem',  'Passagens e Hospedagem',              'expense', v_5_10, 2, 'nao_dedutivel', TRUE, FALSE, 3),
    (p_user_id, '5.10.04', 'Locacao de veiculos',     'Locacao de Veiculos',                 'expense', v_5_10, 2, 'nao_dedutivel', TRUE, FALSE, 4),
    (p_user_id, '5.10.05', 'Loteria e apostas',       'Loteria, Jogos e Apostas',            'expense', v_5_10, 2, 'nao_dedutivel', TRUE, FALSE, 5),
    (p_user_id, '5.10.06', 'Brinquedos e diversao',   'Brinquedos e Entretenimento Infantil', 'expense', v_5_10, 2, 'nao_dedutivel', TRUE, FALSE, 6);

  -- 5.11 Assinaturas Digitais
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.11.01', 'Streaming e redes sociais', 'Redes Sociais e Streaming',  'expense', v_5_11, 2, 'nao_dedutivel', TRUE, FALSE, 1),
    (p_user_id, '5.11.02', 'Servicos digitais',         'Servicos Digitais',           'expense', v_5_11, 2, 'nao_dedutivel', TRUE, FALSE, 2);

  -- 5.12 Vestuario
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.12.01', 'Roupas e acessorios', 'Vestuario, Calcado e Acessorios', 'expense', v_5_12, 2, 'nao_dedutivel', TRUE, FALSE, 1),
    (p_user_id, '5.12.02', 'Lavanderia',          'Servicos de Lavanderia',           'expense', v_5_12, 2, 'nao_dedutivel', TRUE, FALSE, 2);

  -- 5.13 Social e Presentes
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.13.01', 'Doacoes',                  'Doacoes e Projetos Sociais',   'expense', v_5_13, 2, 'nao_dedutivel', TRUE, FALSE, 1),
    (p_user_id, '5.13.02', 'Presentes de aniversario', 'Presentes de Aniversario',     'expense', v_5_13, 2, 'nao_dedutivel', TRUE, FALSE, 2),
    (p_user_id, '5.13.03', 'Presentes de casamento',   'Presentes de Casamento',       'expense', v_5_13, 2, 'nao_dedutivel', TRUE, FALSE, 3),
    (p_user_id, '5.13.04', 'Presentes diversos',       'Presentes Diversos',           'expense', v_5_13, 2, 'nao_dedutivel', TRUE, FALSE, 4),
    (p_user_id, '5.13.05', 'Festas e confraternizacoes', 'Festas e Confraternizacoes', 'expense', v_5_13, 2, 'nao_dedutivel', TRUE, FALSE, 5);

  -- 5.14 Servicos Domesticos
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.14.01', 'Servicos domesticos',   'Servicos Gerais Domesticos',  'expense', v_5_14, 2, 'nao_dedutivel', TRUE, FALSE, 1),
    (p_user_id, '5.14.02', 'Provisoes familiares',   'Provisoes Familiares',        'expense', v_5_14, 2, 'nao_dedutivel', TRUE, FALSE, 2);

  -- 5.15 Animais de Estimacao
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.15.01', 'Pet',  'Animais de Estimacao',  'expense', v_5_15, 2, 'nao_dedutivel', TRUE, FALSE, 1);

  -- 5.16 Seguros
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.16.01', 'Seguro de vida',  'Seguro de Vida',  'expense', v_5_16, 2, 'nao_dedutivel', TRUE, FALSE, 1);

  -- 5.17 Impostos e Tributos
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.17.01', 'IR a pagar',       'IR a Pagar',        'expense', v_5_17, 2, 'nao_dedutivel', TRUE, FALSE, 1),
    (p_user_id, '5.17.02', 'Outros impostos',  'Outros Impostos',   'expense', v_5_17, 2, 'nao_dedutivel', TRUE, FALSE, 2),
    (p_user_id, '5.17.03', 'Outras taxas',     'Outras Taxas',      'expense', v_5_17, 2, 'nao_dedutivel', TRUE, FALSE, 3);

  -- 5.18 Despesas Financeiras
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.18.01', 'Juros pagos',          'Juros Pagos',                  'expense', v_5_18, 2, 'nao_dedutivel', TRUE, FALSE, 1),
    (p_user_id, '5.18.02', 'Tarifas bancarias',    'Tarifas Bancarias',            'expense', v_5_18, 2, 'nao_dedutivel', TRUE, FALSE, 2),
    (p_user_id, '5.18.03', 'Tarifas de cartao',    'Tarifas de Cartao de Credito', 'expense', v_5_18, 2, 'nao_dedutivel', TRUE, FALSE, 3),
    (p_user_id, '5.18.04', 'Outras despesas financeiras', 'Outras Despesas Financeiras', 'expense', v_5_18, 2, 'nao_dedutivel', TRUE, FALSE, 4);

  -- 5.19 Outras Despesas
  INSERT INTO chart_of_accounts (user_id, internal_code, display_name, account_name, group_type, parent_id, depth, tax_treatment, is_system, is_active, sort_order) VALUES
    (p_user_id, '5.19.01', 'Outras despesas',  'Outras Despesas',  'expense', v_5_19, 2, 'nao_dedutivel', TRUE, FALSE, 1);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- Seed: economic_indices_sources
-- Mapeamento de fontes BCB SGS e IBGE SIDRA
-- Ref: estudo-contabil-v1.5 secao 10
-- ============================================

INSERT INTO economic_indices_sources (index_type, priority, provider, series_code, api_url_template, periodicity) VALUES
  -- IPCA
  ('ipca',  1, 'bcb_sgs',     '433',   'https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial={start}&dataFinal={end}', 'monthly'),
  ('ipca',  2, 'ibge_sidra',  '1737',  'https://apisidra.ibge.gov.br/values/t/1737/n1/all/v/63/p/{period}/d/v63%202', 'monthly'),

  -- INPC
  ('inpc',  1, 'bcb_sgs',     '188',   'https://api.bcb.gov.br/dados/serie/bcdata.sgs.188/dados?formato=json&dataInicial={start}&dataFinal={end}', 'monthly'),
  ('inpc',  2, 'ibge_sidra',  '1736',  'https://apisidra.ibge.gov.br/values/t/1736/n1/all/v/63/p/{period}/d/v63%202', 'monthly'),

  -- IGP-M
  ('igpm',  1, 'bcb_sgs',     '189',   'https://api.bcb.gov.br/dados/serie/bcdata.sgs.189/dados?formato=json&dataInicial={start}&dataFinal={end}', 'monthly'),

  -- Selic (meta)
  ('selic', 1, 'bcb_sgs',     '432',   'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json&dataInicial={start}&dataFinal={end}', 'daily'),

  -- CDI
  ('cdi',   1, 'bcb_sgs',     '12',    'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial={start}&dataFinal={end}', 'daily'),

  -- TR
  ('tr',    1, 'bcb_sgs',     '226',   'https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados?formato=json&dataInicial={start}&dataFinal={end}', 'monthly'),

  -- USD/BRL (PTAX venda)
  ('usd_brl', 1, 'bcb_sgs',   '1',     'https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados?formato=json&dataInicial={start}&dataFinal={end}', 'daily'),

  -- Salario minimo
  ('minimum_wage', 1, 'bcb_sgs', '1619', 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados?formato=json&dataInicial={start}&dataFinal={end}', 'annual'),

  -- IPCA subgrupos (IBGE SIDRA tabela 7060)
  ('ipca_food',      1, 'ibge_sidra', '7060', 'https://apisidra.ibge.gov.br/values/t/7060/n1/all/v/63/p/{period}/c315/7170/d/v63%202', 'monthly'),
  ('ipca_housing',   1, 'ibge_sidra', '7060', 'https://apisidra.ibge.gov.br/values/t/7060/n1/all/v/63/p/{period}/c315/7445/d/v63%202', 'monthly'),
  ('ipca_transport', 1, 'ibge_sidra', '7060', 'https://apisidra.ibge.gov.br/values/t/7060/n1/all/v/63/p/{period}/c315/7486/d/v63%202', 'monthly'),
  ('ipca_health',    1, 'ibge_sidra', '7060', 'https://apisidra.ibge.gov.br/values/t/7060/n1/all/v/63/p/{period}/c315/7558/d/v63%202', 'monthly'),
  ('ipca_education', 1, 'ibge_sidra', '7060', 'https://apisidra.ibge.gov.br/values/t/7060/n1/all/v/63/p/{period}/c315/7625/d/v63%202', 'monthly');
