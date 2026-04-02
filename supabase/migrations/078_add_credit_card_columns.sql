-- Migration 078: Add credit card specific columns to accounts
-- Applied via execute_sql (Session 38, E17)
-- Columns only relevant for type='credit_card'; NULL for all other types.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'accounts' AND column_name = 'credit_limit'
  ) THEN
    ALTER TABLE public.accounts ADD COLUMN credit_limit numeric DEFAULT NULL;
    COMMENT ON COLUMN public.accounts.credit_limit IS 'Credit card limit. Only for type=credit_card.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'accounts' AND column_name = 'closing_day'
  ) THEN
    ALTER TABLE public.accounts ADD COLUMN closing_day smallint DEFAULT NULL;
    ALTER TABLE public.accounts ADD CONSTRAINT accounts_closing_day_check CHECK (closing_day >= 1 AND closing_day <= 31);
    COMMENT ON COLUMN public.accounts.closing_day IS 'Day of month when credit card statement closes (1-31). Only for type=credit_card.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'accounts' AND column_name = 'due_day'
  ) THEN
    ALTER TABLE public.accounts ADD COLUMN due_day smallint DEFAULT NULL;
    ALTER TABLE public.accounts ADD CONSTRAINT accounts_due_day_check CHECK (due_day >= 1 AND due_day <= 31);
    COMMENT ON COLUMN public.accounts.due_day IS 'Day of month when credit card payment is due (1-31). Only for type=credit_card.';
  END IF;
END $$;
