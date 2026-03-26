-- Adiciona campo is_collateralized em accounts.
-- Dívidas com garantia real (financiamento imobiliário, veicular, etc.)
-- não entram no cálculo de debt_stress do motor JARVIS.
-- Relevante apenas para type IN ('loan', 'financing').
-- credit_card é sempre descoberto (is_collateralized = false).
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_collateralized BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN accounts.is_collateralized IS 
'Indica se a dívida possui garantia real (imóvel, veículo, equipamento). Relevante apenas para type IN (loan, financing). Usado pelo motor JARVIS para calcular debt_stress: passivos colateralizados não entram no cálculo de stress de dívida descoberta.';
