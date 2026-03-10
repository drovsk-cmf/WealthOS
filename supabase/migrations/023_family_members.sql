-- =====================================================
-- 1. ENUMs
-- =====================================================
CREATE TYPE family_relationship AS ENUM (
  'self',       -- o próprio titular
  'spouse',     -- cônjuge / companheiro(a)
  'child',      -- filho(a)
  'parent',     -- pai / mãe
  'sibling',    -- irmão(ã)
  'pet',        -- animal de estimação
  'other'       -- outros dependentes
);

CREATE TYPE family_role AS ENUM (
  'owner',      -- responsável (gerencia tudo)
  'member'      -- membro (futuramente: acesso limitado)
);

-- =====================================================
-- 2. Tabela family_members
-- =====================================================
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship family_relationship NOT NULL DEFAULT 'other',
  role family_role NOT NULL DEFAULT 'member',
  birth_date DATE,
  is_tax_dependent BOOLEAN NOT NULL DEFAULT false,
  cpf_encrypted TEXT,
  avatar_emoji TEXT DEFAULT '👤',
  cost_center_id UUID REFERENCES cost_centers(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_family_members_user ON family_members(user_id);
CREATE UNIQUE INDEX idx_family_members_unique_name ON family_members(user_id, name);

CREATE TRIGGER family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- 3. RLS
-- =====================================================
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY family_members_select ON family_members
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY family_members_insert ON family_members
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY family_members_update ON family_members
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY family_members_delete ON family_members
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 4. FK: transactions.family_member_id
-- =====================================================
ALTER TABLE transactions ADD COLUMN family_member_id UUID REFERENCES family_members(id);
CREATE INDEX idx_transactions_family_member ON transactions(family_member_id) WHERE family_member_id IS NOT NULL;

-- =====================================================
-- 5. is_overhead flag on cost_centers
-- =====================================================
ALTER TABLE cost_centers ADD COLUMN is_overhead BOOLEAN NOT NULL DEFAULT false;

-- =====================================================
-- 6. Rename default center
-- =====================================================
UPDATE cost_centers
SET name = 'Família (Geral)', is_overhead = true
WHERE is_default = true AND name = 'Pessoal';

-- =====================================================
-- 7. RPC: create_family_member
-- =====================================================
CREATE OR REPLACE FUNCTION create_family_member(
  p_user_id UUID,
  p_name TEXT,
  p_relationship family_relationship DEFAULT 'other',
  p_role family_role DEFAULT 'member',
  p_birth_date DATE DEFAULT NULL,
  p_is_tax_dependent BOOLEAN DEFAULT false,
  p_avatar_emoji TEXT DEFAULT '👤'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
  v_center_id UUID;
  v_center_type center_type;
BEGIN
  IF p_user_id != (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF p_relationship IN ('self', 'spouse') THEN
    v_center_type := 'profit_center';
  ELSE
    v_center_type := 'cost_center';
  END IF;

  INSERT INTO cost_centers (user_id, name, type, is_default, is_active, icon)
  VALUES (p_user_id, p_name, v_center_type, false, true, p_avatar_emoji)
  RETURNING id INTO v_center_id;

  INSERT INTO family_members (
    user_id, name, relationship, role, birth_date,
    is_tax_dependent, avatar_emoji, cost_center_id
  ) VALUES (
    p_user_id, p_name, p_relationship, p_role, p_birth_date,
    p_is_tax_dependent, p_avatar_emoji, v_center_id
  )
  RETURNING id INTO v_member_id;

  RETURN v_member_id;
END;
$$;

-- =====================================================
-- 8. Update default seed
-- =====================================================
CREATE OR REPLACE FUNCTION create_default_cost_center(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_center_id UUID;
BEGIN
  INSERT INTO cost_centers (user_id, name, type, is_default, is_overhead)
  VALUES (p_user_id, 'Família (Geral)', 'neutral', TRUE, TRUE)
  ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_center_id;
  RETURN v_center_id;
END;
$$;
