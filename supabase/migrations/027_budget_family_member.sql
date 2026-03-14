-- ============================================
-- Migration 027: Budget delegado por membro familiar
-- ============================================
-- Adiciona family_member_id ao budgets para permitir
-- orçamento por pessoa. NULL = orçamento do lar.

-- 1) Coluna
ALTER TABLE budgets
ADD COLUMN family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL;

-- 2) Índice para queries filtradas por membro
CREATE INDEX idx_budgets_family_member ON budgets(family_member_id) WHERE family_member_id IS NOT NULL;

-- 3) Unique constraint atualizada
DO $$
BEGIN
  BEGIN
    ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_user_id_category_id_month_key;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER TABLE budgets DROP CONSTRAINT IF EXISTS unique_budget_per_category_month;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

CREATE UNIQUE INDEX unique_budget_per_category_month_member
ON budgets(user_id, category_id, month, COALESCE(family_member_id, '00000000-0000-0000-0000-000000000000'));

-- 4) get_budget_vs_actual com filtro por membro
-- (DROP old 3-param version if exists)
DROP FUNCTION IF EXISTS get_budget_vs_actual(UUID, INT, INT);

CREATE OR REPLACE FUNCTION get_budget_vs_actual(
  p_user_id UUID,
  p_year INT DEFAULT NULL,
  p_month INT DEFAULT NULL,
  p_family_member_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_year INT := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INT);
  v_month INT := COALESCE(p_month, EXTRACT(MONTH FROM CURRENT_DATE)::INT);
  v_month_start DATE := make_date(v_year, v_month, 1);
  v_month_end DATE := (v_month_start + INTERVAL '1 month')::DATE;
  v_result JSON;
BEGIN
  WITH budget_actual AS (
    SELECT
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color,
      b.id AS budget_id,
      b.planned_amount AS planned,
      b.alert_threshold,
      COALESCE(tx_sum.total, 0) AS actual,
      b.planned_amount - COALESCE(tx_sum.total, 0) AS remaining,
      CASE
        WHEN b.planned_amount = 0 THEN 0
        ELSE ROUND(COALESCE(tx_sum.total, 0) / b.planned_amount * 100, 1)
      END AS pct_used,
      CASE
        WHEN COALESCE(tx_sum.total, 0) >= b.planned_amount THEN 'exceeded'
        WHEN b.planned_amount > 0
          AND COALESCE(tx_sum.total, 0) / b.planned_amount >= b.alert_threshold THEN 'warning'
        ELSE 'ok'
      END AS status,
      b.family_member_id
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(t.amount), 0) AS total
      FROM transactions t
      WHERE t.user_id = p_user_id
        AND t.category_id = b.category_id
        AND t.type = 'expense'
        AND t.is_deleted = FALSE
        AND t.date >= v_month_start
        AND t.date < v_month_end
        AND (
          (p_family_member_id IS NULL AND b.family_member_id IS NULL)
          OR t.family_member_id = b.family_member_id
        )
    ) tx_sum ON TRUE
    WHERE b.user_id = p_user_id
      AND b.month = v_month_start
      AND (
        (p_family_member_id IS NULL AND b.family_member_id IS NULL)
        OR b.family_member_id = p_family_member_id
      )
  )
  SELECT json_build_object(
    'items', COALESCE((
      SELECT json_agg(json_build_object(
        'category_name', ba.category_name,
        'category_icon', ba.category_icon,
        'category_color', ba.category_color,
        'budget_id', ba.budget_id,
        'planned', ba.planned,
        'alert_threshold', ba.alert_threshold,
        'actual', ba.actual,
        'remaining', ba.remaining,
        'pct_used', ba.pct_used,
        'status', ba.status,
        'family_member_id', ba.family_member_id
      ) ORDER BY ba.actual DESC)
      FROM budget_actual ba
    ), '[]'::JSON),
    'total_planned', COALESCE((SELECT SUM(ba.planned) FROM budget_actual ba), 0),
    'total_actual', COALESCE((SELECT SUM(ba.actual) FROM budget_actual ba), 0),
    'total_remaining', COALESCE((SELECT SUM(ba.remaining) FROM budget_actual ba), 0),
    'pct_used', CASE
      WHEN COALESCE((SELECT SUM(ba.planned) FROM budget_actual ba), 0) = 0 THEN 0
      ELSE ROUND(
        COALESCE((SELECT SUM(ba.actual) FROM budget_actual ba), 0)
        / (SELECT SUM(ba.planned) FROM budget_actual ba) * 100, 1
      )
    END,
    'month', v_month_start,
    'budget_count', (SELECT COUNT(*) FROM budget_actual)
  ) INTO v_result;

  RETURN v_result;
END;
$fn$;
