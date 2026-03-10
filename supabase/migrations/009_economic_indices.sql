-- ============================================
-- WealthOS - Migration 009: Economic Indices
-- ============================================
-- Phase 8: Index collection, storage, querying
-- Seeds with real BCB SGS data (Mar 2025 - Jan 2026)
-- ============================================

-- ─── 1. Seed IPCA real data (BCB SGS 433) ────────────────────
INSERT INTO economic_indices (index_type, reference_date, value, source_primary, fetched_at)
VALUES
  ('ipca', '2025-03-01', 0.56, 'BCB SGS 433', now()),
  ('ipca', '2025-04-01', 0.43, 'BCB SGS 433', now()),
  ('ipca', '2025-05-01', 0.26, 'BCB SGS 433', now()),
  ('ipca', '2025-06-01', 0.24, 'BCB SGS 433', now()),
  ('ipca', '2025-07-01', 0.26, 'BCB SGS 433', now()),
  ('ipca', '2025-08-01', -0.11, 'BCB SGS 433', now()),
  ('ipca', '2025-09-01', 0.48, 'BCB SGS 433', now()),
  ('ipca', '2025-10-01', 0.09, 'BCB SGS 433', now()),
  ('ipca', '2025-11-01', 0.18, 'BCB SGS 433', now()),
  ('ipca', '2025-12-01', 0.33, 'BCB SGS 433', now()),
  ('ipca', '2026-01-01', 0.33, 'BCB SGS 433', now());

-- Seed Selic monthly snapshots (BCB SGS 432, last value of each month)
INSERT INTO economic_indices (index_type, reference_date, value, source_primary, fetched_at)
VALUES
  ('selic', '2025-03-01', 14.25, 'BCB SGS 432', now()),
  ('selic', '2025-04-01', 14.25, 'BCB SGS 432', now()),
  ('selic', '2025-05-01', 14.75, 'BCB SGS 432', now()),
  ('selic', '2025-06-01', 15.00, 'BCB SGS 432', now()),
  ('selic', '2025-07-01', 15.00, 'BCB SGS 432', now()),
  ('selic', '2025-08-01', 15.00, 'BCB SGS 432', now()),
  ('selic', '2025-09-01', 15.00, 'BCB SGS 432', now()),
  ('selic', '2025-10-01', 15.00, 'BCB SGS 432', now()),
  ('selic', '2025-11-01', 15.00, 'BCB SGS 432', now()),
  ('selic', '2025-12-01', 15.00, 'BCB SGS 432', now()),
  ('selic', '2026-01-01', 15.00, 'BCB SGS 432', now()),
  ('selic', '2026-02-01', 15.00, 'BCB SGS 432', now()),
  ('selic', '2026-03-01', 15.00, 'BCB SGS 432', now());


-- ─── 2. get_economic_indices (read) ──────────────────────────

CREATE OR REPLACE FUNCTION get_economic_indices(
  p_index_type TEXT DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_limit INT DEFAULT 24
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from DATE := COALESCE(p_date_from, (CURRENT_DATE - INTERVAL '24 months')::DATE);
  v_to DATE := COALESCE(p_date_to, CURRENT_DATE);
  v_result JSON;
BEGIN
  -- Public data, no user auth check needed
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.reference_date DESC), '[]'::JSON)
  INTO v_result
  FROM (
    SELECT index_type, reference_date, value, accumulated_12m, accumulated_year,
           source_primary, fetched_at
    FROM economic_indices
    WHERE reference_date >= v_from AND reference_date <= v_to
      AND (p_index_type IS NULL OR index_type::TEXT = p_index_type)
    ORDER BY reference_date DESC
    LIMIT p_limit
  ) t;

  RETURN json_build_object(
    'data', v_result,
    'filters', json_build_object(
      'index_type', p_index_type,
      'date_from', v_from,
      'date_to', v_to
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_economic_indices(TEXT, DATE, DATE, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_economic_indices(TEXT, DATE, DATE, INT) TO anon;


-- ─── 3. get_index_latest (summary card) ──────────────────────

CREATE OR REPLACE FUNCTION get_index_latest()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::JSON)
  INTO v_result
  FROM (
    SELECT DISTINCT ON (index_type)
      index_type, reference_date, value, accumulated_12m, accumulated_year,
      source_primary, fetched_at
    FROM economic_indices
    ORDER BY index_type, reference_date DESC
  ) t;

  RETURN json_build_object(
    'indices', v_result,
    'fetched_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_index_latest() TO authenticated;
GRANT EXECUTE ON FUNCTION get_index_latest() TO anon;


-- ─── 4. Update accumulated values for IPCA ───────────────────

UPDATE economic_indices
SET accumulated_year = (
  SELECT COALESCE(
    (SELECT (EXP(SUM(LN(1 + ei2.value/100.0))) - 1) * 100
     FROM economic_indices ei2
     WHERE ei2.index_type = economic_indices.index_type
       AND EXTRACT(YEAR FROM ei2.reference_date) = EXTRACT(YEAR FROM economic_indices.reference_date)
       AND ei2.reference_date <= economic_indices.reference_date),
    economic_indices.value
  )
)
WHERE index_type = 'ipca';

UPDATE economic_indices
SET accumulated_12m = (
  SELECT COALESCE(
    (SELECT (EXP(SUM(LN(1 + ei2.value/100.0))) - 1) * 100
     FROM economic_indices ei2
     WHERE ei2.index_type = economic_indices.index_type
       AND ei2.reference_date > (economic_indices.reference_date - INTERVAL '12 months')
       AND ei2.reference_date <= economic_indices.reference_date),
    economic_indices.value
  )
)
WHERE index_type = 'ipca';
