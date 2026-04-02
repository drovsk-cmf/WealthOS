-- Migration 080: E39 — Foto de recibo/NF por transação
-- Applied via execute_sql (Session 38)

-- 1. Storage bucket for receipts (private, 5MB limit, images + PDF)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts', 'receipts', false, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 2. RLS: users access only their own folder ({user_id}/*)
CREATE POLICY "Users can upload receipts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own receipts" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Add receipt_path to transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'receipt_path'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN receipt_path text DEFAULT NULL;
    COMMENT ON COLUMN public.transactions.receipt_path IS 'Storage path to receipt/NF image. Format: {user_id}/{transaction_id}.{ext}';
  END IF;
END $$;
