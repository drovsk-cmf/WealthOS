-- =============================================================
-- Migration 025: Coleta diária automática de índices econômicos
-- Usa extensão http (síncrona) + pg_cron
-- Fonte: BCB SGS API pública
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.cron_fetch_economic_indices()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_source RECORD;
  v_start_date TEXT;
  v_end_date TEXT;
  v_url TEXT;
  v_response extensions.http_response;
  v_body TEXT;
  v_data jsonb;
  v_point jsonb;
  v_iso_date TEXT;
  v_ref_date TEXT;
  v_month_key TEXT;
  v_value NUMERIC;
  v_inserted INT := 0;
  v_errors TEXT[] := '{}';
  v_last_per_month jsonb := '{}'::jsonb;
BEGIN
  v_end_date := to_char(CURRENT_DATE, 'DD/MM/YYYY');
  v_start_date := to_char(CURRENT_DATE - INTERVAL '4 months', 'DD/MM/YYYY');

  FOR v_source IN
    SELECT index_type, provider, series_code, api_url_template, periodicity
    FROM economic_indices_sources
    WHERE is_active = TRUE AND provider = 'bcb_sgs'
    ORDER BY index_type, priority
  LOOP
    BEGIN
      v_url := REPLACE(
        REPLACE(v_source.api_url_template, '{start}', v_start_date),
        '{end}', v_end_date
      );

      SELECT * INTO v_response FROM extensions.http_get(v_url);

      IF v_response.status != 200 THEN
        v_errors := array_append(v_errors, v_source.index_type || ': HTTP ' || v_response.status);
        CONTINUE;
      END IF;

      v_body := v_response.content;

      BEGIN
        v_data := v_body::jsonb;
      EXCEPTION WHEN OTHERS THEN
        v_errors := array_append(v_errors, v_source.index_type || ': JSON parse error');
        CONTINUE;
      END;

      IF jsonb_array_length(v_data) = 0 THEN
        v_errors := array_append(v_errors, v_source.index_type || ': empty response');
        CONTINUE;
      END IF;

      v_last_per_month := '{}'::jsonb;

      FOR v_point IN SELECT * FROM jsonb_array_elements(v_data)
      LOOP
        v_iso_date := substring(v_point->>'data' FROM 7 FOR 4) || '-' ||
                      substring(v_point->>'data' FROM 4 FOR 2) || '-' ||
                      substring(v_point->>'data' FROM 1 FOR 2);
        v_month_key := substring(v_iso_date FROM 1 FOR 7);
        v_value := (v_point->>'valor')::NUMERIC;

        IF v_value IS NULL THEN CONTINUE; END IF;

        IF v_source.periodicity = 'daily' THEN
          v_last_per_month := jsonb_set(
            v_last_per_month,
            ARRAY[v_month_key],
            jsonb_build_object('date', v_iso_date, 'value', v_value)
          );
        ELSE
          v_ref_date := v_month_key || '-01';

          INSERT INTO economic_indices (index_type, reference_date, value, source_primary, fetched_at)
          VALUES (v_source.index_type::index_type, v_ref_date::DATE, v_value,
                  'BCB SGS ' || v_source.series_code, NOW())
          ON CONFLICT (index_type, reference_date) DO UPDATE
            SET value = EXCLUDED.value,
                source_primary = EXCLUDED.source_primary,
                fetched_at = NOW();

          v_inserted := v_inserted + 1;
        END IF;
      END LOOP;

      IF v_source.periodicity = 'daily' THEN
        FOR v_month_key IN SELECT jsonb_object_keys(v_last_per_month)
        LOOP
          v_ref_date := v_month_key || '-01';
          v_value := (v_last_per_month->v_month_key->>'value')::NUMERIC;

          INSERT INTO economic_indices (index_type, reference_date, value, source_primary, fetched_at)
          VALUES (v_source.index_type::index_type, v_ref_date::DATE, v_value,
                  'BCB SGS ' || v_source.series_code, NOW())
          ON CONFLICT (index_type, reference_date) DO UPDATE
            SET value = EXCLUDED.value,
                source_primary = EXCLUDED.source_primary,
                fetched_at = NOW();

          v_inserted := v_inserted + 1;
        END LOOP;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_errors := array_append(v_errors, v_source.index_type || ': ' || SQLERRM);
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'errors', to_jsonb(v_errors),
    'fetched_at', NOW()
  );
END;
$$;

-- Schedule: daily at 06:00 UTC (03:00 BRT)
SELECT cron.schedule(
  'cron_fetch_indices',
  '0 6 * * *',
  $$SELECT public.cron_fetch_economic_indices()$$
);
