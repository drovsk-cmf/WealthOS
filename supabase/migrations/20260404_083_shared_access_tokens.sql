-- 083: E35 — Shared access tokens for read-only accountant access
-- Tabela de tokens temporários + RPC de validação

CREATE TABLE IF NOT EXISTS public.shared_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  scope TEXT NOT NULL DEFAULT 'tax',
  label TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shared_access_tokens_token ON public.shared_access_tokens(token) WHERE NOT is_revoked;
CREATE INDEX IF NOT EXISTS idx_shared_access_tokens_user ON public.shared_access_tokens(user_id);

ALTER TABLE public.shared_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY shared_access_select ON public.shared_access_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY shared_access_insert ON public.shared_access_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY shared_access_update ON public.shared_access_tokens FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY shared_access_delete ON public.shared_access_tokens FOR DELETE USING (auth.uid() = user_id);

-- RPC: validar token e retornar dados fiscais (SECURITY DEFINER — bypassa RLS)
CREATE OR REPLACE FUNCTION public.validate_shared_token(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record shared_access_tokens%ROWTYPE;
  v_result JSON;
BEGIN
  SELECT * INTO v_record
  FROM shared_access_tokens
  WHERE token = p_token
    AND NOT is_revoked
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Token inválido ou expirado');
  END IF;

  UPDATE shared_access_tokens
  SET access_count = access_count + 1,
      last_accessed_at = now()
  WHERE id = v_record.id;

  IF v_record.scope = 'tax' THEN
    SELECT json_build_object(
      'valid', true,
      'scope', v_record.scope,
      'expires_at', v_record.expires_at,
      'user_name', COALESCE(p.display_name, 'Usuário'),
      'data', json_build_object(
        'irpf_deductions', (
          SELECT COALESCE(json_agg(row_to_json(d)), '[]'::json)
          FROM (
            SELECT c.name as category_name, c.dirpf_group,
                   SUM(t.amount) as total, COUNT(*) as count
            FROM transactions t
            JOIN categories c ON c.id = t.category_id
            WHERE t.user_id = v_record.user_id
              AND t.is_deleted = false AND t.type = 'expense'
              AND c.is_deductible = true
              AND t.date >= (date_trunc('year', now()) - interval '1 year')::date
              AND t.date < date_trunc('year', now())::date
            GROUP BY c.name, c.dirpf_group ORDER BY total DESC
          ) d
        ),
        'income_summary', (
          SELECT COALESCE(json_agg(row_to_json(i)), '[]'::json)
          FROM (
            SELECT c.name as category_name, SUM(t.amount) as total, COUNT(*) as count
            FROM transactions t
            LEFT JOIN categories c ON c.id = t.category_id
            WHERE t.user_id = v_record.user_id
              AND t.is_deleted = false AND t.type = 'income'
              AND t.date >= (date_trunc('year', now()) - interval '1 year')::date
              AND t.date < date_trunc('year', now())::date
            GROUP BY c.name ORDER BY total DESC
          ) i
        ),
        'asset_summary', (
          SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json)
          FROM (
            SELECT name, current_value, asset_type, acquisition_date
            FROM assets
            WHERE user_id = v_record.user_id AND is_deleted = false
            ORDER BY current_value DESC
          ) a
        )
      )
    ) INTO v_result
    FROM users_profile p
    WHERE p.id = v_record.user_id;

    RETURN v_result;
  END IF;

  RETURN json_build_object('valid', false, 'error', 'Escopo não suportado');
END;
$$;
