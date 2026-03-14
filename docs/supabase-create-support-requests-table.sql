-- Create the support_requests table used by Help & Support complaint submissions.
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor).

CREATE TABLE IF NOT EXISTS public.support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  user_email text,
  session_id text,
  reason text NOT NULL,
  details text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'critical',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'support_requests_status_check'
  ) THEN
    ALTER TABLE public.support_requests
      ADD CONSTRAINT support_requests_status_check
      CHECK (status IN ('open', 'resolved'));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'support_requests_severity_check'
  ) THEN
    ALTER TABLE public.support_requests
      DROP CONSTRAINT support_requests_severity_check;
  END IF;

  ALTER TABLE public.support_requests
    ADD CONSTRAINT support_requests_severity_check
    CHECK (severity IN ('critical', 'non_critical'));
END $$;

CREATE INDEX IF NOT EXISTS support_requests_status_created_at_idx
  ON public.support_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS support_requests_user_id_idx
  ON public.support_requests (user_id);

COMMENT ON TABLE public.support_requests IS 'User-submitted help and support complaints shown in admin alerts.';
