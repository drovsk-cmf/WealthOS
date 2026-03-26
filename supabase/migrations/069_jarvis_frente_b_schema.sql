-- ============================================================
-- Frente B: Schema evolution para Motor JARVIS
-- 1. investment_class enum para accounts type=investment
-- 2. interest_rate numeric para loan/financing/credit_card
-- 3. rate_type enum para loan/financing
-- 4. FIX: depreciation_rate ampliado para numeric(7,4)
-- Ref: FINANCIAL-METHODOLOGY.md §6, PENDENCIAS-FUTURAS E8c
-- ============================================================

DO $$ BEGIN
  CREATE TYPE investment_class AS ENUM (
    'renda_fixa', 'renda_variavel', 'fii', 'previdencia', 'cripto', 'outro'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rate_type AS ENUM (
    'pre', 'pos_cdi', 'pos_ipca', 'pos_tr'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS investment_class investment_class,
  ADD COLUMN IF NOT EXISTS interest_rate    NUMERIC,
  ADD COLUMN IF NOT EXISTS rate_type        rate_type;

ALTER TABLE accounts
  ADD CONSTRAINT chk_investment_class_type
    CHECK (investment_class IS NULL OR type = 'investment');

ALTER TABLE accounts
  ADD CONSTRAINT chk_interest_rate_type
    CHECK (interest_rate IS NULL OR type IN ('loan', 'financing', 'credit_card'));

ALTER TABLE accounts
  ADD CONSTRAINT chk_rate_type_type
    CHECK (rate_type IS NULL OR type IN ('loan', 'financing'));

ALTER TABLE accounts
  ADD CONSTRAINT chk_interest_rate_positive
    CHECK (interest_rate IS NULL OR interest_rate > 0);

COMMENT ON COLUMN accounts.investment_class IS 'Classe do investimento. Somente para type=investment.';
COMMENT ON COLUMN accounts.interest_rate IS 'Taxa de juros mensal (% a.m.). Somente para type IN (loan, financing, credit_card).';
COMMENT ON COLUMN accounts.rate_type IS 'Tipo de taxa (pre, pos_cdi, pos_ipca, pos_tr). Somente para type IN (loan, financing).';

-- FIX: depreciation_rate de numeric(5,4) para numeric(7,4)
ALTER TABLE assets
  ALTER COLUMN depreciation_rate TYPE NUMERIC(7,4);

COMMENT ON COLUMN assets.depreciation_rate IS 'Taxa de depreciacao anual em %. Ampliado para suportar taxas reais de veiculos (15-20% a.a.).';
