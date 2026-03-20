-- P16: Expansão ENUM asset_category de 5 para 14 valores (adendo v1.5 §3.4)
-- P7a: parent_asset_id em assets + asset_id em transactions/journal_entries (adendo v1.5 §3.1-3.2)
-- Applied to oniefy-prod (mngjbrbxapazdddzgoje) as 'p16_p7a_asset_category_expansion_and_hierarchy'

-- ═══ P16: Novos valores do ENUM ═══
ALTER TYPE asset_category ADD VALUE IF NOT EXISTS 'vehicle_auto';
ALTER TYPE asset_category ADD VALUE IF NOT EXISTS 'vehicle_moto';
ALTER TYPE asset_category ADD VALUE IF NOT EXISTS 'vehicle_recreational';
ALTER TYPE asset_category ADD VALUE IF NOT EXISTS 'vehicle_aircraft';
ALTER TYPE asset_category ADD VALUE IF NOT EXISTS 'jewelry';
ALTER TYPE asset_category ADD VALUE IF NOT EXISTS 'fashion';
ALTER TYPE asset_category ADD VALUE IF NOT EXISTS 'furniture';
ALTER TYPE asset_category ADD VALUE IF NOT EXISTS 'sports';
ALTER TYPE asset_category ADD VALUE IF NOT EXISTS 'collectibles';

-- ═══ P7a: Hierarquia de ativos ═══

ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS parent_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assets_parent ON public.assets(parent_asset_id) WHERE parent_asset_id IS NOT NULL;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tx_asset ON public.transactions(asset_id) WHERE asset_id IS NOT NULL;

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_je_asset ON public.journal_entries(asset_id) WHERE asset_id IS NOT NULL;
