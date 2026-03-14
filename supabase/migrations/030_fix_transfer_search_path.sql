-- Migration 030: Fix create_transfer_with_journal missing search_path
-- Bug: migration 026 rewrote the function without SET search_path = public.
-- Risk: SECURITY DEFINER without fixed search_path allows schema injection.
-- Discovered by Gemini audit (14/03/2026). Confirmed by query on pg_proc.

ALTER FUNCTION create_transfer_with_journal(uuid, uuid, uuid, numeric, text, date, boolean, entry_source)
SET search_path = public;
