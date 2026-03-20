-- P15: Cronograma guiado de 5 semanas (adendo v1.5 §4.4)
-- Adiciona week_number à setup_journey existente + atualiza RPCs
-- Applied to oniefy-prod (mngjbrbxapazdddzgoje) as 'p15_setup_journey_week_number'

-- 1. Adicionar coluna
ALTER TABLE public.setup_journey ADD COLUMN IF NOT EXISTS week_number SMALLINT NOT NULL DEFAULT 1;

-- 2. Backfill week_number para linhas existentes
UPDATE public.setup_journey SET week_number = CASE step_key
  WHEN 'cutoff_date'       THEN 1
  WHEN 'create_accounts'   THEN 1
  WHEN 'recurring_expenses' THEN 2
  WHEN 'import_statements' THEN 3
  WHEN 'import_card_bills' THEN 3
  WHEN 'categorize'        THEN 4
  WHEN 'create_budget'     THEN 5
  ELSE 1
END;

-- 3. Atualizar initialize_setup_journey com week_number
CREATE OR REPLACE FUNCTION public.initialize_setup_journey(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  INSERT INTO setup_journey (user_id, step_key, step_order, week_number, title, description, status) VALUES
    (p_user_id, 'cutoff_date',       1, 1, 'Definir data de corte',
     'A partir de quando o Oniefy deve considerar seus dados',
     'available'),
    (p_user_id, 'create_accounts',   2, 1, 'Cadastrar suas contas',
     'Adicione suas contas bancárias e cartões',
     'locked'),
    (p_user_id, 'recurring_expenses',3, 2, 'Registrar despesas fixas',
     'Aluguel, internet, seguros e outras recorrências',
     'locked'),
    (p_user_id, 'import_statements', 4, 3, 'Importar extratos bancários',
     'Suba um OFX ou CSV do seu banco para popular suas transações',
     'locked'),
    (p_user_id, 'import_card_bills', 5, 3, 'Importar faturas de cartão',
     'Suba a fatura do cartão de crédito (OFX ou CSV)',
     'locked'),
    (p_user_id, 'categorize',        6, 4, 'Categorizar transações',
     'Revise e corrija categorias para análises mais precisas',
     'locked'),
    (p_user_id, 'create_budget',     7, 5, 'Criar seu primeiro orçamento',
     'Defina limites por categoria para controlar seus gastos',
     'locked')
  ON CONFLICT (user_id, step_key) DO NOTHING;
END;
$$;

-- 4. Atualizar get_setup_journey para retornar week_number
CREATE OR REPLACE FUNCTION public.get_setup_journey(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result json;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM setup_journey WHERE user_id = p_user_id) THEN
    PERFORM initialize_setup_journey(p_user_id);
  END IF;

  SELECT json_build_object(
    'steps', (
      SELECT json_agg(row_to_json(s) ORDER BY s.step_order)
      FROM (
        SELECT step_key, step_order, week_number, title, description, status, completed_at, metadata
        FROM setup_journey WHERE user_id = p_user_id
      ) s
    ),
    'total', (SELECT count(*) FROM setup_journey WHERE user_id = p_user_id),
    'completed', (SELECT count(*) FROM setup_journey WHERE user_id = p_user_id AND status = 'completed'),
    'current_step', (SELECT step_key FROM setup_journey WHERE user_id = p_user_id AND status IN ('available','in_progress') ORDER BY step_order LIMIT 1),
    'all_done', (SELECT count(*) = 0 FROM setup_journey WHERE user_id = p_user_id AND status != 'completed'),
    'cutoff_date', (SELECT cutoff_date FROM users_profile WHERE id = p_user_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
