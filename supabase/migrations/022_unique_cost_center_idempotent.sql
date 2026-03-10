-- Prevent duplicate cost centers per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_cost_centers_unique_name_user
  ON cost_centers (user_id, name);

-- Make seed idempotent
CREATE OR REPLACE FUNCTION create_default_cost_center(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_center_id UUID;
BEGIN
  INSERT INTO cost_centers (user_id, name, type, is_default)
  VALUES (p_user_id, 'Pessoal', 'neutral', TRUE)
  ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_center_id;
  RETURN v_center_id;
END;
$$;
