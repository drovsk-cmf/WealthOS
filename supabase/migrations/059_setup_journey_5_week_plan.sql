-- P15: Cronograma guiado de setup (5 semanas)
-- Tabela setup_journey + RPCs get_setup_journey / advance_setup_journey
-- Applied via Supabase MCP as 'setup_journey_5_week_plan'

CREATE TABLE IF NOT EXISTS public.setup_journey (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_key    TEXT NOT NULL,
  step_order  SMALLINT NOT NULL,
  week_number SMALLINT NOT NULL DEFAULT 1,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked','available','in_progress','completed')),
  completed_at TIMESTAMPTZ,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, step_key)
);

ALTER TABLE public.setup_journey ENABLE ROW LEVEL SECURITY;

CREATE POLICY sj_select ON public.setup_journey FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY sj_update ON public.setup_journey FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY sj_insert ON public.setup_journey FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE TRIGGER set_updated_at_setup_journey
  BEFORE UPDATE ON public.setup_journey
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── get_setup_journey ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_setup_journey(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_result JSONB;
  v_cutoff DATE;
BEGIN
  IF (SELECT auth.uid()) IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT count(*) INTO v_count FROM setup_journey WHERE user_id = p_user_id;

  IF v_count = 0 THEN
    INSERT INTO setup_journey (user_id, step_key, step_order, week_number, title, description, status) VALUES
      (p_user_id, 'cutoff_date',        1, 1, 'Definir data de corte',        'A partir de quando o Oniefy deve considerar seus dados',         'available'),
      (p_user_id, 'create_accounts',     2, 1, 'Cadastrar suas contas',        'Adicione suas contas bancárias e cartões',                       'locked'),
      (p_user_id, 'recurring_expenses',  3, 2, 'Registrar despesas fixas',     'Aluguel, internet, seguros e outras recorrências',               'locked'),
      (p_user_id, 'import_statements',   4, 3, 'Importar extratos bancários',  'Suba um OFX ou CSV do seu banco para popular suas transações',   'locked'),
      (p_user_id, 'import_card_bills',   5, 3, 'Importar faturas de cartão',   'Suba a fatura do cartão de crédito (OFX ou CSV)',                'locked'),
      (p_user_id, 'categorize',          6, 4, 'Categorizar transações',       'Revise e corrija categorias para análises mais precisas',        'locked'),
      (p_user_id, 'create_budget',       7, 5, 'Criar seu primeiro orçamento', 'Defina limites por categoria para controlar seus gastos',        'locked');
  END IF;

  SELECT cutoff_date INTO v_cutoff FROM users_profile WHERE id = p_user_id;

  SELECT jsonb_build_object(
    'steps', COALESCE(jsonb_agg(
      jsonb_build_object(
        'step_key', s.step_key,
        'step_order', s.step_order,
        'week_number', s.week_number,
        'title', s.title,
        'description', s.description,
        'status', s.status,
        'completed_at', s.completed_at,
        'metadata', s.metadata
      ) ORDER BY s.step_order
    ), '[]'::jsonb),
    'total', (SELECT count(*) FROM setup_journey WHERE user_id = p_user_id),
    'completed', (SELECT count(*) FROM setup_journey WHERE user_id = p_user_id AND status = 'completed'),
    'current_step', (SELECT step_key FROM setup_journey WHERE user_id = p_user_id AND status IN ('available','in_progress') ORDER BY step_order LIMIT 1),
    'all_done', NOT EXISTS(SELECT 1 FROM setup_journey WHERE user_id = p_user_id AND status != 'completed'),
    'cutoff_date', v_cutoff
  ) INTO v_result
  FROM setup_journey s
  WHERE s.user_id = p_user_id;

  RETURN v_result;
END;
$$;

-- ─── advance_setup_journey ───────────────────────────────
CREATE OR REPLACE FUNCTION public.advance_setup_journey(
  p_user_id UUID,
  p_step_key TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_order SMALLINT;
  v_total INT;
  v_completed INT;
  v_next_key TEXT;
  v_all_done BOOLEAN;
BEGIN
  IF (SELECT auth.uid()) IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE setup_journey
  SET status = 'completed',
      completed_at = now(),
      metadata = COALESCE(p_metadata, '{}')
  WHERE user_id = p_user_id
    AND step_key = p_step_key
    AND status IN ('available', 'in_progress')
  RETURNING step_order INTO v_current_order;

  IF v_current_order IS NULL THEN
    RETURN jsonb_build_object('completed_step', NULL);
  END IF;

  UPDATE setup_journey
  SET status = 'available'
  WHERE user_id = p_user_id
    AND step_order = v_current_order + 1
    AND status = 'locked';

  SELECT count(*) INTO v_total FROM setup_journey WHERE user_id = p_user_id;
  SELECT count(*) INTO v_completed FROM setup_journey WHERE user_id = p_user_id AND status = 'completed';
  SELECT step_key INTO v_next_key FROM setup_journey WHERE user_id = p_user_id AND status IN ('available','in_progress') ORDER BY step_order LIMIT 1;
  v_all_done := (v_completed = v_total);

  RETURN jsonb_build_object(
    'completed_step', p_step_key,
    'total_steps', v_total,
    'completed_count', v_completed,
    'next_step', v_next_key,
    'all_done', v_all_done
  );
END;
$$;
