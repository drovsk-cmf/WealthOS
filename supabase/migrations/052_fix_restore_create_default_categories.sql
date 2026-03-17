-- Migration 052: Restore create_default_categories body (accidentally wiped in 051)
-- + auth guard for defense in depth.
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  INSERT INTO categories (user_id, name, type, icon, color, is_system) VALUES
    (p_user_id, 'Alimentação',        'expense', 'utensils',       '#EF4444', true),
    (p_user_id, 'Transporte',         'expense', 'car',            '#F97316', true),
    (p_user_id, 'Moradia',            'expense', 'home',           '#8B5CF6', true),
    (p_user_id, 'Saúde',              'expense', 'heart-pulse',    '#EC4899', true),
    (p_user_id, 'Educação',           'expense', 'graduation-cap', '#3B82F6', true),
    (p_user_id, 'Lazer',              'expense', 'gamepad-2',      '#10B981', true),
    (p_user_id, 'Vestuário',          'expense', 'shirt',          '#F59E0B', true),
    (p_user_id, 'Serviços',           'expense', 'wifi',           '#6366F1', true),
    (p_user_id, 'Impostos e Taxas',   'expense', 'landmark',       '#DC2626', true),
    (p_user_id, 'Outros (Despesa)',   'expense', 'circle-dot',     '#6B7280', true)
  ON CONFLICT (user_id, name, type) DO NOTHING;

  INSERT INTO categories (user_id, name, type, icon, color, is_system) VALUES
    (p_user_id, 'Salário',                      'income', 'banknote',      '#22C55E', true),
    (p_user_id, 'Freelance',                     'income', 'laptop',        '#14B8A6', true),
    (p_user_id, 'Rendimentos de Investimento',   'income', 'trending-up',   '#0EA5E9', true),
    (p_user_id, 'Aluguel Recebido',              'income', 'building',      '#A855F7', true),
    (p_user_id, 'Presente / Bônus',              'income', 'gift',          '#F43F5E', true),
    (p_user_id, 'Outros (Receita)',              'income', 'circle-dot',    '#6B7280', true)
  ON CONFLICT (user_id, name, type) DO NOTHING;
END;
$$;
