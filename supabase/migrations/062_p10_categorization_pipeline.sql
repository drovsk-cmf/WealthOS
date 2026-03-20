-- P10: Pipeline de categorização determinística (adendo v1.5 §5.4 etapas 1-2)
-- Applied to oniefy-prod (mngjbrbxapazdddzgoje) as 'p10_categorization_pipeline'

-- 1. categorization_rules: regras globais regex (26 padrões BR)
CREATE TABLE IF NOT EXISTS public.categorization_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern TEXT NOT NULL,
  category_name TEXT NOT NULL,
  priority SMALLINT NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categorization_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY cr_select ON public.categorization_rules FOR SELECT TO authenticated USING (true);

-- 2. merchant_patterns: padrões aprendidos por usuário
CREATE TABLE IF NOT EXISTS public.merchant_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  usage_count INT NOT NULL DEFAULT 1,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, pattern)
);
ALTER TABLE public.merchant_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY mp_select ON public.merchant_patterns FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY mp_insert ON public.merchant_patterns FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY mp_update ON public.merchant_patterns FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY mp_delete ON public.merchant_patterns FOR DELETE USING (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS idx_mp_user_pattern ON public.merchant_patterns(user_id, pattern);
CREATE INDEX IF NOT EXISTS idx_cr_active ON public.categorization_rules(is_active) WHERE is_active = true;

-- 3. Seed 26 regras globais BR
INSERT INTO public.categorization_rules (pattern, category_name, priority) VALUES
  ('mercado|supermercado|hiper|atacad|hortifrut|sacolao|acougue|padaria|confeitaria', 'Alimentação', 10),
  ('restaurante|lanchonete|pizzaria|hamburguer|sushi|churrascaria|cantina|buffet|rodizio', 'Alimentação', 10),
  ('ifood|rappi|uber.*eat|zé delivery|aiqfome|james', 'Alimentação', 10),
  ('uber(?!.*eat)|99.*taxi|99pop|cabify|indriver|lyft', 'Transporte', 20),
  ('combustivel|gasolina|etanol|diesel|posto|ipiranga|shell|br distribui|ale combusti', 'Transporte', 20),
  ('estacionamento|zona azul|estapar|sem parar|conectcar|veloe|move mais|tag pedagio|pedagio', 'Transporte', 20),
  ('aluguel|condominio|iptu|energia|eletrica|cemig|cpfl|enel|equatorial|celpe|coelba|light', 'Moradia', 30),
  ('agua.*esgoto|saneago|sabesp|copasa|caesb|casan|embasa|compesa', 'Moradia', 30),
  ('internet|fibra|vivo.*fibra|claro.*net|oi.*fibra|tim.*live|brisanet', 'Moradia', 30),
  ('gas.*natural|comgas|ceg|gasmig|bahiagas|sulgás|potigás', 'Moradia', 30),
  ('farmacia|drogaria|droga.*raia|drogasil|pague.*menos|panvel|pacheco|araujo|nissei', 'Saúde', 40),
  ('hospital|clinica|laboratorio|consulta|medic|odonto|dentista|psicolog|fisioterapia', 'Saúde', 40),
  ('plano.*saude|unimed|amil|bradesco.*saude|sulamerica.*saude|hapvida|notredame', 'Saúde', 40),
  ('escola|colegio|faculdade|universidade|curso|udemy|alura|rocketseat|hotmart|descomplica', 'Educação', 50),
  ('livro|livraria|saraiva|amazon.*kindle|estante.*virtual|cultura', 'Educação', 50),
  ('netflix|spotify|disney|hbo|amazon.*prime|globoplay|paramount|apple.*tv|youtube.*premium|deezer', 'Lazer', 60),
  ('cinema|ingresso|ticketmaster|sympla|eventim|teatro|show|concerto', 'Lazer', 60),
  ('playstation|xbox|steam|nintendo|epic.*games|riot|blizzard', 'Lazer', 60),
  ('riachuelo|renner|cea|marisa|hering|zara|shein|shopee|mercadolivre|magalu|americanas|casas.*bahia', 'Vestuário', 70),
  ('celular|telefone|vivo|claro|tim|oi|nextel', 'Serviços', 70),
  ('seguro.*auto|seguro.*vida|seguro.*residenc|porto.*seguro|tokio.*marine|allianz|liberty|mapfre|zurich|bradesco.*segur|itau.*segur', 'Seguros', 75),
  ('darf|gps|das.*simples|irpf|ipva|detran|licenciamento|multa.*transito', 'Impostos e Taxas', 80),
  ('salario|folha.*pagamento|contra.*cheque|holerite|prolabore|pro.*labore', 'Salário', 15),
  ('dividendo|jscp|jcp|juros.*capital|rendimento|yield', 'Rendimentos', 25),
  ('aluguel.*recebido|locacao.*recebida|inquilino', 'Aluguel Recebido', 25),
  ('freelance|prestacao.*servico|nf.*servico|nota.*fiscal.*servico|pj.*recebimento', 'Freelance', 25)
ON CONFLICT DO NOTHING;

-- 4. auto_categorize_transaction reescrita (pipeline 3 etapas)
CREATE OR REPLACE FUNCTION public.auto_categorize_transaction(p_user_id UUID, p_description TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cat_id UUID; v_dl TEXT := LOWER(TRIM(p_description)); v_rule RECORD;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF v_dl IS NULL OR v_dl = '' THEN RETURN NULL; END IF;
  -- Etapa 1: merchant_patterns (user-specific)
  SELECT mp.category_id INTO v_cat_id FROM merchant_patterns mp WHERE mp.user_id = p_user_id AND mp.pattern = v_dl LIMIT 1;
  IF v_cat_id IS NOT NULL THEN
    UPDATE merchant_patterns SET usage_count = usage_count + 1, last_used_at = now() WHERE user_id = p_user_id AND pattern = v_dl;
    RETURN v_cat_id;
  END IF;
  -- Etapa 2: categorization_rules (global regex)
  FOR v_rule IN SELECT cr.category_name FROM categorization_rules cr WHERE cr.is_active AND v_dl ~ cr.pattern ORDER BY cr.priority LIMIT 1 LOOP
    SELECT c.id INTO v_cat_id FROM categories c WHERE c.user_id = p_user_id AND LOWER(c.name) = LOWER(v_rule.category_name) LIMIT 1;
    IF v_cat_id IS NOT NULL THEN RETURN v_cat_id; END IF;
  END LOOP;
  -- Etapa 3: fallback (category name match)
  SELECT c.id INTO v_cat_id FROM categories c WHERE c.user_id = p_user_id AND LOWER(c.name) = v_dl LIMIT 1;
  IF v_cat_id IS NOT NULL THEN RETURN v_cat_id; END IF;
  SELECT c.id INTO v_cat_id FROM categories c WHERE c.user_id = p_user_id AND v_dl LIKE '%' || LOWER(c.name) || '%' ORDER BY LENGTH(c.name) DESC LIMIT 1;
  RETURN v_cat_id;
END; $$;

-- 5. learn_merchant_pattern (aprendizado por correção)
CREATE OR REPLACE FUNCTION public.learn_merchant_pattern(p_user_id UUID, p_description TEXT, p_category_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pattern TEXT := LOWER(TRIM(p_description));
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF v_pattern IS NULL OR v_pattern = '' OR p_category_id IS NULL THEN RETURN; END IF;
  INSERT INTO merchant_patterns (user_id, pattern, category_id, usage_count, last_used_at)
  VALUES (p_user_id, v_pattern, p_category_id, 1, now())
  ON CONFLICT (user_id, pattern) DO UPDATE SET category_id = EXCLUDED.category_id, usage_count = merchant_patterns.usage_count + 1, last_used_at = now();
END; $$;
