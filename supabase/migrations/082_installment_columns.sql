-- Migration 082: Add installment columns to transactions (E67)
-- Applied via execute_sql (Session 39)
-- Supports Brazilian credit card installment system (parcelamento)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'installment_group_id'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN installment_group_id uuid DEFAULT NULL;
    COMMENT ON COLUMN public.transactions.installment_group_id IS 'Groups installments of the same purchase. NULL for non-installment transactions.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'installment_current'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN installment_current smallint DEFAULT NULL;
    ALTER TABLE public.transactions ADD CONSTRAINT transactions_installment_current_check CHECK (installment_current >= 1);
    COMMENT ON COLUMN public.transactions.installment_current IS 'Current installment number (1-based). NULL for non-installment.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'installment_total'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN installment_total smallint DEFAULT NULL;
    ALTER TABLE public.transactions ADD CONSTRAINT transactions_installment_total_check CHECK (installment_total >= 2);
    COMMENT ON COLUMN public.transactions.installment_total IS 'Total installments in purchase (>=2). NULL for non-installment.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'installment_original_amount'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN installment_original_amount numeric DEFAULT NULL;
    COMMENT ON COLUMN public.transactions.installment_original_amount IS 'Original total purchase amount. NULL for non-installment.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transactions_installment_group'
  ) THEN
    CREATE INDEX idx_transactions_installment_group ON public.transactions (installment_group_id) WHERE installment_group_id IS NOT NULL;
  END IF;
END $$;
