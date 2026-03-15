-- 032: UX-H2-04 category_source + UX-H2-05 undo_import

-- ═══ Part 1: Category source tracking (UX-H2-04) ═══

-- Enum for category assignment source
CREATE TYPE category_assignment_source AS ENUM ('manual', 'auto', 'import_auto');

-- Add column to transactions (nullable, default null = legacy/unknown)
ALTER TABLE transactions ADD COLUMN category_source category_assignment_source;

-- Backfill: imported transactions with category → import_auto; manual source with category → manual
UPDATE transactions SET category_source = 'import_auto'
WHERE source IN ('csv_import', 'ofx_import') AND category_id IS NOT NULL;

UPDATE transactions SET category_source = 'manual'
WHERE source = 'manual' AND category_id IS NOT NULL;

-- ═══ Part 2: Undo import batch (UX-H2-05) ═══

-- RPC: soft-delete all transactions from a specific import batch
-- Only allowed within 72h of import. Append-only: sets is_deleted=true.
CREATE OR REPLACE FUNCTION undo_import_batch(
  p_user_id uuid,
  p_batch_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_created_at timestamptz;
  v_count integer;
  v_hours_since numeric;
BEGIN
  -- Verify the batch belongs to this user and get creation time
  SELECT MIN(created_at) INTO v_batch_created_at
  FROM transactions
  WHERE user_id = p_user_id
    AND import_batch_id = p_batch_id
    AND is_deleted = false;

  IF v_batch_created_at IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'message', 'Lote de importação não encontrado ou já desfeito.'
    );
  END IF;

  -- Check 72h window
  v_hours_since := EXTRACT(EPOCH FROM (now() - v_batch_created_at)) / 3600;
  IF v_hours_since > 72 THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'message', 'Prazo de 72 horas para desfazer importação expirado.',
      'hours_since', round(v_hours_since::numeric, 1)
    );
  END IF;

  -- Soft-delete all transactions in the batch
  UPDATE transactions
  SET is_deleted = true,
      updated_at = now()
  WHERE user_id = p_user_id
    AND import_batch_id = p_batch_id
    AND is_deleted = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'status', 'success',
    'undone_count', v_count,
    'batch_id', p_batch_id
  );
END;
$$;
