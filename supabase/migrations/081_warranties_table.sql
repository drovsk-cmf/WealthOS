-- Migration 081: E31 — Warranties table
-- Applied via execute_sql (Session 38)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'warranties') THEN
    CREATE TABLE public.warranties (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      product_name text NOT NULL,
      purchase_date date NOT NULL,
      manufacturer_months smallint NOT NULL DEFAULT 12,
      card_extension_months smallint NOT NULL DEFAULT 0,
      receipt_path text,
      notes text,
      transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "warranties_select" ON public.warranties FOR SELECT TO authenticated USING (user_id = auth.uid());
    CREATE POLICY "warranties_insert" ON public.warranties FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
    CREATE POLICY "warranties_update" ON public.warranties FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
    CREATE POLICY "warranties_delete" ON public.warranties FOR DELETE TO authenticated USING (user_id = auth.uid());

    CREATE INDEX idx_warranties_user ON public.warranties(user_id);
    CREATE TRIGGER set_updated_at_warranties BEFORE UPDATE ON public.warranties FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;
