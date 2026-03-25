-- E6: Metas de economia (savings goals)
-- Tabela para metas financeiras com target, progresso e prazo

CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(15,2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_date DATE,
  icon TEXT NOT NULL DEFAULT 'target',
  color TEXT NOT NULL DEFAULT '#56688F',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS (initplan pattern)
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "savings_goals_select" ON savings_goals
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "savings_goals_insert" ON savings_goals
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "savings_goals_update" ON savings_goals
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "savings_goals_delete" ON savings_goals
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Trigger updated_at (reuses existing handle_updated_at)
CREATE TRIGGER set_updated_at BEFORE UPDATE ON savings_goals
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Index
CREATE INDEX idx_savings_goals_user ON savings_goals(user_id);
CREATE INDEX idx_savings_goals_active ON savings_goals(user_id) WHERE is_completed = false;
