-- Colleague help board: tradespeople post backup / partner / equipment requests.
CREATE TABLE IF NOT EXISTS public.help_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  kind text NOT NULL CHECK (kind IN ('backup','partner','equipment','other')),
  trade text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  start_date date,
  duration_days int CHECK (duration_days IS NULL OR duration_days BETWEEN 1 AND 365),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 4000),
  contact_name text NOT NULL DEFAULT '',
  contact_phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS help_requests_created_idx ON public.help_requests (created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.help_requests TO authenticated;
GRANT ALL ON public.help_requests TO service_role;

ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "help_requests read signed in" ON public.help_requests;
CREATE POLICY "help_requests read signed in" ON public.help_requests
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "help_requests insert own" ON public.help_requests;
CREATE POLICY "help_requests insert own" ON public.help_requests
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "help_requests update own" ON public.help_requests;
CREATE POLICY "help_requests update own" ON public.help_requests
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "help_requests delete own" ON public.help_requests;
CREATE POLICY "help_requests delete own" ON public.help_requests
  FOR DELETE TO authenticated USING (owner_id = auth.uid());
