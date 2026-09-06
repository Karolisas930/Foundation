-- Bridges a real gap in the homeowner registration flow: a guest posting a
-- project has no Supabase user yet, so the project was previously only ever
-- saved to a client-side demo ledger (sessionStorage) and never reached the
-- real `jobs` table. Since account confirmation almost always happens in a
-- DIFFERENT browser tab (email links), sessionStorage can't bridge that gap
-- either. This table holds the project server-side, keyed by email, until
-- the person actually confirms an account - at which point claim_pending_
-- projects() (called from /auth/callback) moves it into `jobs` for real.

CREATE TABLE IF NOT EXISTS public.pending_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  title text NOT NULL,
  description text,
  trade text,
  estimated_budget integer,
  location_zip text,
  city text,
  language text,
  urgency text,
  claimed_at timestamptz,
  claimed_job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pending_projects_email_unclaimed_idx
  ON public.pending_projects (email)
  WHERE claimed_at IS NULL;

ALTER TABLE public.pending_projects ENABLE ROW LEVEL SECURITY;

-- Anyone (including a not-yet-authenticated guest) can create a pending
-- project. There is deliberately no SELECT/UPDATE policy for anon or
-- authenticated roles - all reading and claiming happens through the
-- SECURITY DEFINER function below, which only ever acts on the calling
-- user's own verified email.
DROP POLICY IF EXISTS pending_projects_insert_anyone ON public.pending_projects;
CREATE POLICY pending_projects_insert_anyone ON public.pending_projects
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON public.pending_projects TO anon, authenticated;
GRANT ALL ON public.pending_projects TO service_role;

-- Claims every unclaimed pending project whose email matches the CALLING
-- user's own verified email (derived from auth.uid(), never from a
-- parameter), inserts each as a real row in `jobs` owned by that user, and
-- marks the pending rows claimed. Safe to call multiple times (e.g. once
-- per sign-in path) - already-claimed rows are simply skipped.
CREATE OR REPLACE FUNCTION public.claim_pending_projects()
RETURNS TABLE (job_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  caller_email text;
  rec record;
  new_job_id uuid;
BEGIN
  IF caller_id IS NULL THEN
    RETURN;
  END IF;

  SELECT email INTO caller_email FROM auth.users WHERE id = caller_id;
  IF caller_email IS NULL THEN
    RETURN;
  END IF;

  FOR rec IN
    SELECT * FROM public.pending_projects
    WHERE email = caller_email AND claimed_at IS NULL
    ORDER BY created_at ASC
  LOOP
    INSERT INTO public.jobs (
      owner_id, title, description, trade, estimated_budget,
      location_zip, city, language, urgency, status
    ) VALUES (
      caller_id, rec.title, rec.description, rec.trade, rec.estimated_budget,
      rec.location_zip, rec.city, rec.language, rec.urgency, 'open'
    )
    RETURNING id INTO new_job_id;

    UPDATE public.pending_projects
      SET claimed_at = now(), claimed_job_id = new_job_id
      WHERE id = rec.id;

    job_id := new_job_id;
    RETURN NEXT;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_pending_projects() TO authenticated;
