-- Migration: LGPD data retention policies
-- Ref: MAPEAMENTO-LGPD.md lacunas L1 e L2
-- Aplicar no projeto SP (mngjbrbxapazdddzgoje) via Supabase MCP ou Dashboard

-- 1. Cleanup analytics_events (retenção: 12 meses)
CREATE OR REPLACE FUNCTION cron_cleanup_analytics_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.analytics_events
  WHERE created_at < now() - interval '12 months';
END;
$$;

-- 2. Cleanup notification_log (retenção: 90 dias)
CREATE OR REPLACE FUNCTION cron_cleanup_notification_log()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.notification_log
  WHERE sent_at < now() - interval '90 days';
END;
$$;

-- 3. Cleanup access_logs (retenção: 90 dias)
-- Pode já existir no SP; ON CONFLICT seguro via CREATE OR REPLACE
CREATE OR REPLACE FUNCTION cron_cleanup_access_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.access_logs
  WHERE created_at < now() - interval '90 days';
END;
$$;

-- pg_cron schedules (executar apenas se pg_cron estiver habilitado)
-- Domingo 05:00 UTC para as 3 limpezas (baixa carga)
SELECT cron.schedule('cleanup-analytics-events', '0 5 * * 0', 'SELECT cron_cleanup_analytics_events()');
SELECT cron.schedule('cleanup-notification-log', '0 5 * * 0', 'SELECT cron_cleanup_notification_log()');
-- access_logs: verificar se já existe antes de criar
-- SELECT cron.schedule('cleanup-access-logs', '0 5 * * 0', 'SELECT cron_cleanup_access_logs()');
