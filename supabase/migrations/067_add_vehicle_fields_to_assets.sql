-- Migration 067: Add vehicle-specific fields to assets table
-- Supports dedicated vehicle registration with plate, brand, model, year, color
-- Fixes: bulk entry "Bens" tab allowed vehicle registration without plate

ALTER TABLE assets ADD COLUMN IF NOT EXISTS license_plate TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS vehicle_brand TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS vehicle_model TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS vehicle_year INTEGER;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS vehicle_color TEXT;

-- Unique plate per user (prevents duplicate vehicle registration)
CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_user_plate
  ON assets (user_id, license_plate)
  WHERE license_plate IS NOT NULL AND license_plate != '';

COMMENT ON COLUMN assets.license_plate IS 'Placa do veículo (formato Mercosul ABC1D23 ou antigo ABC-1234)';
COMMENT ON COLUMN assets.vehicle_brand IS 'Marca do veículo (ex: Honda, Toyota, Volkswagen)';
COMMENT ON COLUMN assets.vehicle_model IS 'Modelo do veículo (ex: Civic, Corolla, Gol)';
COMMENT ON COLUMN assets.vehicle_year IS 'Ano de fabricação ou modelo';
COMMENT ON COLUMN assets.vehicle_color IS 'Cor predominante do veículo';
