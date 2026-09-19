-- Run this against YOUR local Supabase (e.g. `psql "$DATABASE_URL" -f
-- db/manual-migrations/20260918120000_site_visits.sql`, or paste it into the
-- local Studio SQL editor). It is idempotent.
--
-- `site_visits` — the homeowner's proposed days + preferred time slot for the
-- contractor who won a project. This used to live only in localStorage, so the
-- contractor never actually saw it.

CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL UNIQUE REFERENCES public.jobs(id) ON DELETE CASCADE,
  homeowner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contractor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  dates timestamptz[] NOT NULL DEFAULT '{}',
  slot text NOT NULL DEFAULT 'morning' CHECK (slot IN ('morning', 'afternoon', 'evening')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_visits_homeowner_idx ON public.site_visits(homeowner_id);
CREATE INDEX IF NOT EXISTS site_visits_contractor_idx ON public.site_visits(contractor_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_visits TO authenticated;
GRANT ALL ON public.site_visits TO service_role;

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_visits_select_own ON public.site_visits;
CREATE POLICY site_visits_select_own ON public.site_visits
  FOR SELECT TO authenticated
  USING (auth.uid() = homeowner_id OR auth.uid() = contractor_id);

DROP POLICY IF EXISTS site_visits_insert_own ON public.site_visits;
CREATE POLICY site_visits_insert_own ON public.site_visits
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = homeowner_id);

DROP POLICY IF EXISTS site_visits_update_own ON public.site_visits;
CREATE POLICY site_visits_update_own ON public.site_visits
  FOR UPDATE TO authenticated
  USING (auth.uid() = homeowner_id) WITH CHECK (auth.uid() = homeowner_id);

DROP POLICY IF EXISTS site_visits_delete_own ON public.site_visits;
CREATE POLICY site_visits_delete_own ON public.site_visits
  FOR DELETE TO authenticated USING (auth.uid() = homeowner_id);

DROP TRIGGER IF EXISTS site_visits_set_updated_at ON public.site_visits;
CREATE TRIGGER site_visits_set_updated_at BEFORE UPDATE ON public.site_visits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
