-- ============================================================
-- UX-H1-07: Analytics events table
-- Minimal instrumentation for activation/retention metrics
-- ============================================================

CREATE TABLE public.analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  properties jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_analytics_events_user_created ON public.analytics_events (user_id, created_at DESC);
CREATE INDEX idx_analytics_events_name ON public.analytics_events (event_name, created_at DESC);

-- RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own events"
  ON public.analytics_events FOR SELECT
  USING (auth.uid() = user_id);

-- No UPDATE or DELETE - events are append-only

-- ============================================================
-- RPC: track_event (convenience wrapper)
-- ============================================================
CREATE OR REPLACE FUNCTION public.track_event(
  p_event_name text,
  p_properties jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  INSERT INTO public.analytics_events (user_id, event_name, properties)
  VALUES (auth.uid(), p_event_name, p_properties)
  RETURNING id INTO _id;
  
  RETURN _id;
END;
$$;

-- ============================================================
-- RPC: get_retention_metrics (D1/D7/D30 by cohort)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_retention_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result jsonb;
BEGIN
  WITH user_cohort AS (
    SELECT 
      u.id as user_id,
      u.created_at::date as signup_date
    FROM auth.users u
    WHERE u.created_at > now() - interval '90 days'
  ),
  user_activity AS (
    SELECT DISTINCT
      ae.user_id,
      ae.created_at::date as activity_date
    FROM public.analytics_events ae
    WHERE ae.event_name = 'dashboard_viewed'
      AND ae.created_at > now() - interval '90 days'
  ),
  retention AS (
    SELECT
      uc.user_id,
      uc.signup_date,
      bool_or(ua.activity_date = uc.signup_date + 1) as returned_d1,
      bool_or(ua.activity_date BETWEEN uc.signup_date + 1 AND uc.signup_date + 7) as returned_d7,
      bool_or(ua.activity_date BETWEEN uc.signup_date + 1 AND uc.signup_date + 30) as returned_d30
    FROM user_cohort uc
    LEFT JOIN user_activity ua ON ua.user_id = uc.user_id
    GROUP BY uc.user_id, uc.signup_date
  )
  SELECT jsonb_build_object(
    'total_users', count(*),
    'd1_returned', count(*) FILTER (WHERE returned_d1),
    'd1_rate', CASE WHEN count(*) > 0 THEN round(100.0 * count(*) FILTER (WHERE returned_d1) / count(*), 1) ELSE 0 END,
    'd7_returned', count(*) FILTER (WHERE returned_d7),
    'd7_rate', CASE WHEN count(*) > 0 THEN round(100.0 * count(*) FILTER (WHERE returned_d7) / count(*), 1) ELSE 0 END,
    'd30_returned', count(*) FILTER (WHERE returned_d30),
    'd30_rate', CASE WHEN count(*) > 0 THEN round(100.0 * count(*) FILTER (WHERE returned_d30) / count(*), 1) ELSE 0 END,
    'period', 'last_90_days'
  ) INTO _result
  FROM retention;
  
  RETURN COALESCE(_result, '{"total_users":0,"d1_returned":0,"d1_rate":0,"d7_returned":0,"d7_rate":0,"d30_returned":0,"d30_rate":0,"period":"last_90_days"}'::jsonb);
END;
$$;

COMMENT ON TABLE public.analytics_events IS 'UX-H1-07: Minimal product analytics for activation/retention tracking';
COMMENT ON FUNCTION public.track_event IS 'Insert analytics event for the authenticated user';
COMMENT ON FUNCTION public.get_retention_metrics IS 'D1/D7/D30 retention rates for users signed up in last 90 days';
