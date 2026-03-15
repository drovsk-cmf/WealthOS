-- 034: Security hardening - revoke unnecessary privileges from anon and authenticated
--
-- TRUNCATE bypasses RLS in PostgreSQL. Neither anon nor authenticated
-- users should ever be able to truncate tables.
-- TRIGGER and REFERENCES are also unnecessary for API access.
--
-- DML (SELECT, INSERT, UPDATE, DELETE) remains on both roles because
-- RLS policies are the actual access control layer.

DO $$
DECLARE
  _tbl text;
BEGIN
  FOR _tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('REVOKE TRUNCATE ON public.%I FROM anon, authenticated', _tbl);
    EXECUTE format('REVOKE TRIGGER ON public.%I FROM anon, authenticated', _tbl);
    EXECUTE format('REVOKE REFERENCES ON public.%I FROM anon, authenticated', _tbl);
  END LOOP;
END;
$$;
