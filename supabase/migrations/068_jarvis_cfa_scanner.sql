-- ============================================================
-- Motor JARVIS CFA - Camada 1 (Scanner) + Camada 2 (Combinador)
-- 6 regras determinísticas com zero schema change
-- Ref: CFA-ONIEFY-MAPPING.md §6, HANDOVER §30.10
-- ============================================================

CREATE OR REPLACE FUNCTION get_jarvis_scan(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_findings     JSON[] := ARRAY[]::JSON[];
  v_solvency     JSON;
  v_total_savings NUMERIC := 0;
  v_critical_n   INT := 0;
  v_warning_n    INT := 0;
  v_info_n       INT := 0;
  v_severity     TEXT;
  v_savings      NUMERIC;
  v_rec          RECORD;
  v_monthly_income NUMERIC := 0;
  v_runway       NUMERIC;
BEGIN
  -- Auth guard
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Pre-compute: average monthly income (last 6 months)
  SELECT COALESCE(
    SUM(t.amount) / GREATEST(COUNT(DISTINCT date_trunc('month', t.date))::INT, 1),
    0
  )
  INTO v_monthly_income
  FROM transactions t
  WHERE t.user_id = p_user_id
    AND t.type = 'income'
    AND t.is_deleted = false
    AND t.date >= (CURRENT_DATE - INTERVAL '6 months');

  -- ═══ R03: Assinaturas canceláveis (duplicatas na mesma categoria) ═══
  FOR v_rec IN (
    WITH active_subs AS (
      SELECT
        r.id,
        (r.template_transaction->>'description')         AS description,
        ABS((r.template_transaction->>'amount')::NUMERIC) AS amount,
        (r.template_transaction->>'category_id')::UUID    AS category_id,
        c.name                                            AS category_name
      FROM recurrences r
      LEFT JOIN categories c
        ON c.id = (r.template_transaction->>'category_id')::UUID
      WHERE r.user_id   = p_user_id
        AND r.is_active  = true
        AND (r.template_transaction->>'type') = 'expense'
    ),
    cat_groups AS (
      SELECT
        category_id,
        COALESCE(category_name, 'Sem categoria') AS category_name,
        COUNT(*)       AS sub_count,
        SUM(amount)    AS total_amount,
        json_agg(json_build_object(
          'description', description,
          'amount',      amount
        ) ORDER BY amount DESC) AS items
      FROM active_subs
      GROUP BY category_id, category_name
      HAVING COUNT(*) >= 2
    )
    SELECT * FROM cat_groups
  )
  LOOP
    v_severity := CASE
      WHEN v_monthly_income > 0 AND v_rec.total_amount > v_monthly_income * 0.15 THEN 'critical'
      WHEN v_rec.sub_count >= 3 THEN 'warning'
      ELSE 'info'
    END;
    v_savings := ROUND(v_rec.total_amount * 0.5, 2);

    v_findings := v_findings || json_build_object(
      'rule_id',                 'R03',
      'severity',                v_severity,
      'title',                   v_rec.sub_count || ' assinaturas em "' || v_rec.category_name || '"',
      'description',             v_rec.sub_count || ' assinaturas na categoria "'
                                   || v_rec.category_name || '", somando R$ '
                                   || ROUND(v_rec.total_amount, 2) || '/mes',
      'potential_savings_monthly', v_savings,
      'affected_items',          v_rec.items
    );
    v_total_savings := v_total_savings + v_savings;
    IF v_severity = 'critical' THEN v_critical_n := v_critical_n + 1;
    ELSIF v_severity = 'warning' THEN v_warning_n := v_warning_n + 1;
    ELSE v_info_n := v_info_n + 1; END IF;
  END LOOP;

  -- R03b: Total subscription burden (> 15% of income)
  IF v_monthly_income > 0 THEN
    FOR v_rec IN (
      SELECT
        COUNT(*)                                              AS total_subs,
        SUM(ABS((r.template_transaction->>'amount')::NUMERIC)) AS total_amount
      FROM recurrences r
      WHERE r.user_id   = p_user_id
        AND r.is_active  = true
        AND (r.template_transaction->>'type') = 'expense'
      HAVING SUM(ABS((r.template_transaction->>'amount')::NUMERIC)) > v_monthly_income * 0.15
    )
    LOOP
      v_findings := v_findings || json_build_object(
        'rule_id',                 'R03b',
        'severity',                'warning',
        'title',                   'Assinaturas somam ' || ROUND(v_rec.total_amount / v_monthly_income * 100, 1) || '% da renda',
        'description',             v_rec.total_subs || ' assinaturas ativas totalizam R$ '
                                     || ROUND(v_rec.total_amount, 2)
                                     || '/mes (' || ROUND(v_rec.total_amount / v_monthly_income * 100, 1)
                                     || '% da renda media mensal de R$ '
                                     || ROUND(v_monthly_income, 2) || ')',
        'potential_savings_monthly', 0,
        'affected_items',          NULL
      );
      v_warning_n := v_warning_n + 1;
    END LOOP;
  END IF;

  -- ═══ R06: Categoria de despesa em escalada (+20% por 3 meses) ═══
  FOR v_rec IN (
    WITH monthly_cat AS (
      SELECT
        t.category_id,
        c.name                              AS category_name,
        date_trunc('month', t.date)::DATE   AS month,
        SUM(t.amount)                       AS total
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
      WHERE t.user_id   = p_user_id
        AND t.type       = 'expense'
        AND t.is_deleted = false
        AND t.date >= (date_trunc('month', CURRENT_DATE) - INTERVAL '4 months')
        AND t.date <  date_trunc('month', CURRENT_DATE)
      GROUP BY t.category_id, c.name, date_trunc('month', t.date)
    ),
    ranked AS (
      SELECT *,
        LAG(total, 1) OVER (PARTITION BY category_id ORDER BY month) AS prev_1,
        LAG(total, 2) OVER (PARTITION BY category_id ORDER BY month) AS prev_2,
        ROW_NUMBER()  OVER (PARTITION BY category_id ORDER BY month DESC) AS rn
      FROM monthly_cat
    ),
    escalating AS (
      SELECT
        category_id,
        category_name,
        total                                                              AS latest,
        prev_1,
        prev_2,
        ROUND((total - prev_1) / NULLIF(prev_1, 0) * 100, 1)             AS growth_last,
        ROUND((prev_1 - prev_2) / NULLIF(prev_2, 0) * 100, 1)            AS growth_prev
      FROM ranked
      WHERE rn = 1
        AND prev_1 IS NOT NULL AND prev_2 IS NOT NULL
        AND prev_1 > 0 AND prev_2 > 0
        AND total  > prev_1 * 1.20
        AND prev_1 > prev_2 * 1.20
        AND total  > 100
    )
    SELECT * FROM escalating
  )
  LOOP
    v_severity := CASE
      WHEN v_rec.growth_last > 50 THEN 'critical'
      WHEN v_rec.growth_last > 30 THEN 'warning'
      ELSE 'info'
    END;
    v_savings := ROUND(v_rec.latest - v_rec.prev_2, 2);

    v_findings := v_findings || json_build_object(
      'rule_id',                 'R06',
      'severity',                v_severity,
      'title',                   '"' || v_rec.category_name || '" em escalada',
      'description',             'Crescimento de +' || v_rec.growth_prev || '% e depois +'
                                   || v_rec.growth_last || '% em 3 meses consecutivos. '
                                   || 'Atual: R$ ' || ROUND(v_rec.latest, 2)
                                   || '/mes (era R$ ' || ROUND(v_rec.prev_2, 2) || ')',
      'potential_savings_monthly', v_savings,
      'affected_items',          json_build_object(
        'category',  v_rec.category_name,
        'current',   ROUND(v_rec.latest, 2),
        'baseline',  ROUND(v_rec.prev_2, 2),
        'growth_m1', v_rec.growth_prev,
        'growth_m2', v_rec.growth_last
      )
    );
    v_total_savings := v_total_savings + v_savings;
    IF v_severity = 'critical' THEN v_critical_n := v_critical_n + 1;
    ELSIF v_severity = 'warning' THEN v_warning_n := v_warning_n + 1;
    ELSE v_info_n := v_info_n + 1; END IF;
  END LOOP;

  -- ═══ R07: Reserva de emergencia insuficiente ═══
  v_solvency := get_solvency_metrics(p_user_id);
  v_runway   := (v_solvency->>'runway_months')::NUMERIC;

  IF v_runway < 6 AND v_runway != 999 AND (v_solvency->>'burn_rate')::NUMERIC > 0 THEN
    v_severity := CASE WHEN v_runway < 3 THEN 'critical' ELSE 'warning' END;

    v_findings := v_findings || json_build_object(
      'rule_id',                 'R07',
      'severity',                v_severity,
      'title',                   'Runway de ' || v_runway || ' meses',
      'description',             'Burn rate: R$ ' || (v_solvency->>'burn_rate')
                                   || '/mes. Reserva liquida (T1+T2): R$ '
                                   || ROUND(
                                        (v_solvency->>'tier1_total')::NUMERIC
                                      + (v_solvency->>'tier2_total')::NUMERIC, 2)
                                   || '. Meta minima: 6 meses = R$ '
                                   || ROUND((v_solvency->>'burn_rate')::NUMERIC * 6, 2),
      'potential_savings_monthly', 0,
      'affected_items',          v_solvency
    );
    IF v_severity = 'critical' THEN v_critical_n := v_critical_n + 1;
    ELSE v_warning_n := v_warning_n + 1; END IF;
  END IF;

  -- ═══ R08: Depreciacao de ativo > rendimento liquido ═══
  FOR v_rec IN (
    WITH asset_depr AS (
      SELECT
        a.id           AS asset_id,
        a.name,
        a.category::TEXT,
        a.current_value,
        a.depreciation_rate,
        a.currency,
        ROUND(a.current_value * a.depreciation_rate / 100.0 / 12.0, 2) AS monthly_depr
      FROM assets a
      WHERE a.user_id = p_user_id
        AND a.depreciation_rate > 0
    ),
    asset_inc AS (
      SELECT
        t.asset_id,
        ROUND(
          SUM(t.amount) / GREATEST(COUNT(DISTINCT date_trunc('month', t.date))::INT, 1),
          2
        ) AS avg_monthly_income
      FROM transactions t
      WHERE t.user_id   = p_user_id
        AND t.asset_id  IS NOT NULL
        AND t.type       = 'income'
        AND t.is_deleted = false
        AND t.date >= (CURRENT_DATE - INTERVAL '6 months')
      GROUP BY t.asset_id
    )
    SELECT
      d.asset_id,
      d.name,
      d.category,
      d.current_value,
      d.currency,
      d.monthly_depr,
      COALESCE(i.avg_monthly_income, 0)                       AS monthly_income,
      ROUND(d.monthly_depr - COALESCE(i.avg_monthly_income, 0), 2) AS net_loss
    FROM asset_depr d
    LEFT JOIN asset_inc i ON i.asset_id = d.asset_id
    WHERE d.monthly_depr > COALESCE(i.avg_monthly_income, 0)
  )
  LOOP
    v_severity := CASE
      WHEN v_rec.net_loss > 1000 THEN 'critical'
      WHEN v_rec.net_loss > 500  THEN 'warning'
      ELSE 'info'
    END;
    v_savings := v_rec.net_loss;

    v_findings := v_findings || json_build_object(
      'rule_id',                 'R08',
      'severity',                v_severity,
      'title',                   '"' || v_rec.name || '" perde R$ ' || v_rec.net_loss || '/mes',
      'description',             'Depreciacao mensal: R$ ' || v_rec.monthly_depr
                                   || '. Rendimento mensal: R$ ' || v_rec.monthly_income
                                   || '. Perda liquida: R$ ' || v_rec.net_loss
                                   || '/mes (valor atual: R$ ' || ROUND(v_rec.current_value, 2) || ')',
      'potential_savings_monthly', v_savings,
      'affected_items',          json_build_object(
        'asset_id',     v_rec.asset_id,
        'asset_name',   v_rec.name,
        'category',     v_rec.category,
        'current_value', ROUND(v_rec.current_value, 2),
        'depreciation',  v_rec.monthly_depr,
        'income',        v_rec.monthly_income
      )
    );
    v_total_savings := v_total_savings + v_savings;
    IF v_severity = 'critical' THEN v_critical_n := v_critical_n + 1;
    ELSIF v_severity = 'warning' THEN v_warning_n := v_warning_n + 1;
    ELSE v_info_n := v_info_n + 1; END IF;
  END LOOP;

  -- ═══ R09: Concentracao de renda (>80% em uma fonte) ═══
  FOR v_rec IN (
    WITH income_by_cat AS (
      SELECT
        t.category_id,
        COALESCE(c.name, 'Sem categoria') AS category_name,
        SUM(t.amount)                     AS cat_total
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.user_id   = p_user_id
        AND t.type       = 'income'
        AND t.is_deleted = false
        AND t.date >= (CURRENT_DATE - INTERVAL '6 months')
      GROUP BY t.category_id, c.name
    ),
    grand AS (
      SELECT SUM(cat_total) AS grand_total FROM income_by_cat
    )
    SELECT
      s.category_name,
      ROUND(s.cat_total, 2)                              AS source_total,
      ROUND(g.grand_total, 2)                             AS grand_total,
      ROUND(s.cat_total / NULLIF(g.grand_total, 0) * 100, 1) AS pct
    FROM income_by_cat s, grand g
    WHERE g.grand_total > 0
      AND s.cat_total / g.grand_total > 0.80
  )
  LOOP
    v_severity := CASE WHEN v_rec.pct > 95 THEN 'critical' ELSE 'warning' END;

    v_findings := v_findings || json_build_object(
      'rule_id',                 'R09',
      'severity',                v_severity,
      'title',                   v_rec.pct || '% da renda em "' || v_rec.category_name || '"',
      'description',             'Nos ultimos 6 meses, R$ '
                                   || v_rec.source_total || ' de R$ '
                                   || v_rec.grand_total || ' vieram de "'
                                   || v_rec.category_name
                                   || '". Se essa fonte parar, o impacto e imediato.',
      'potential_savings_monthly', 0,
      'affected_items',          json_build_object(
        'source',     v_rec.category_name,
        'pct',        v_rec.pct,
        'from_source', v_rec.source_total,
        'total',       v_rec.grand_total
      )
    );
    IF v_severity = 'critical' THEN v_critical_n := v_critical_n + 1;
    ELSE v_warning_n := v_warning_n + 1; END IF;
  END LOOP;

  -- ═══ R10: Fluxo mensal negativo persistente (2+ meses) ═══
  FOR v_rec IN (
    WITH recent AS (
      SELECT
        month,
        total_income,
        total_expense,
        (total_income - total_expense) AS net_flow,
        ROW_NUMBER() OVER (ORDER BY month DESC) AS rn
      FROM monthly_snapshots
      WHERE user_id = p_user_id
        AND month < date_trunc('month', CURRENT_DATE)::DATE
      ORDER BY month DESC
      LIMIT 6
    ),
    agg AS (
      SELECT
        COUNT(*) FILTER (WHERE net_flow < 0)            AS negative_count,
        ROUND(COALESCE(SUM(net_flow) FILTER (WHERE rn <= 3), 0), 2) AS sum_last_3,
        json_agg(
          json_build_object(
            'month',   month,
            'income',  ROUND(total_income, 2),
            'expense', ROUND(total_expense, 2),
            'net',     ROUND(net_flow, 2)
          ) ORDER BY month DESC
        ) FILTER (WHERE net_flow < 0) AS negative_months
      FROM recent
    )
    SELECT * FROM agg WHERE negative_count >= 2
  )
  LOOP
    v_severity := CASE
      WHEN v_rec.negative_count >= 4 THEN 'critical'
      WHEN v_rec.negative_count >= 2 THEN 'warning'
      ELSE 'info'
    END;

    v_findings := v_findings || json_build_object(
      'rule_id',                 'R10',
      'severity',                v_severity,
      'title',                   v_rec.negative_count || ' meses com fluxo negativo',
      'description',             v_rec.negative_count
                                   || ' dos ultimos 6 meses tiveram despesas > receitas. '
                                   || 'Saldo acumulado (3 meses): R$ ' || v_rec.sum_last_3,
      'potential_savings_monthly', 0,
      'affected_items',          v_rec.negative_months
    );
    IF v_severity = 'critical' THEN v_critical_n := v_critical_n + 1;
    ELSIF v_severity = 'warning' THEN v_warning_n := v_warning_n + 1;
    ELSE v_info_n := v_info_n + 1; END IF;
  END LOOP;

  -- ═══ Camada 2: Combinador de cenarios ═══
  RETURN json_build_object(
    'scan_date',      CURRENT_TIMESTAMP,
    'findings_count', COALESCE(array_length(v_findings, 1), 0),
    'findings',       COALESCE(to_json(v_findings), '[]'::JSON),
    'summary', json_build_object(
      'total_potential_savings_monthly', ROUND(v_total_savings, 2),
      'projected_3m',   ROUND(v_total_savings * 3, 2),
      'projected_6m',   ROUND(v_total_savings * 6, 2),
      'projected_12m',  ROUND(v_total_savings * 12, 2),
      'critical_count', v_critical_n,
      'warning_count',  v_warning_n,
      'info_count',     v_info_n
    ),
    'solvency', v_solvency
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_jarvis_scan(UUID) TO authenticated;

COMMENT ON FUNCTION get_jarvis_scan IS
  'Motor JARVIS CFA - Camada 1 (Scanner: R03,R06,R07,R08,R09,R10) + Camada 2 (Combinador). '
  'Retorna findings com severity, savings e projecoes. Ref: CFA-ONIEFY-MAPPING.md §6';
