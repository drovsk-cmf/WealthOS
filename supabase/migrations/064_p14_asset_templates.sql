-- P14: Cadastro assistido de bens - tabela asset_templates (adendo v1.5 §5.6)
-- Applied to oniefy-prod (mngjbrbxapazdddzgoje) as 'p14_asset_templates'

CREATE TABLE IF NOT EXISTS public.asset_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  default_depreciation_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  reference_value_brl NUMERIC(14,2),
  useful_life_years INT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.asset_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY at_select ON public.asset_templates FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_asset_templates_category ON public.asset_templates(category);
CREATE INDEX IF NOT EXISTS idx_asset_templates_search ON public.asset_templates USING gin(to_tsvector('portuguese', name));

-- 28 templates comuns BR (imóveis, veículos, eletrônicos, móveis, jóias, esportes, colecionáveis)
-- See full seed in apply_migration 'p14_asset_templates'
