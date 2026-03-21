-- P11: Gateway IA - tabelas ai_cache e ai_usage_log + RPCs + cron
-- Applied to oniefy-prod (mngjbrbxapazdddzgoje) as 'p11_ai_gateway_tables'

CREATE TABLE IF NOT EXISTS public.ai_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_hash TEXT NOT NULL,
  model TEXT NOT NULL,
  use_case TEXT NOT NULL,
  prompt_sanitized TEXT NOT NULL,
  response JSONB NOT NULL,
  tokens_in INT NOT NULL DEFAULT 0,
  tokens_out INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  UNIQUE(prompt_hash, model, use_case)
);
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY aic_select ON public.ai_cache FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_ai_cache_lookup ON public.ai_cache(prompt_hash, model, use_case);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expiry ON public.ai_cache(expires_at);

CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  use_case TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_in INT NOT NULL DEFAULT 0,
  tokens_out INT NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
  cached BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY aul_select ON public.ai_usage_log FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY aul_insert ON public.ai_usage_log FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON public.ai_usage_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_month ON public.ai_usage_log(user_id, use_case, created_at);

-- RPCs: check_ai_rate_limit, get_ai_cache, save_ai_result
-- Cron: weekly-cleanup-ai-cache
-- See full RPC source in apply_migration 'p11_ai_gateway_tables'
