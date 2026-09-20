-- ---------------------------------------------------------------------------
-- Unclaimed guest projects — one-time cleanup + permanent case-insensitive fix
-- ---------------------------------------------------------------------------
-- A guest posting a project is stored in public.pending_projects keyed by the
-- email they typed. claim_pending_projects() then matched that value against
-- auth.users.email with a plain `=`. Supabase lowercases the address it
-- stores, so anyone who typed "Karolis@Gmail.com" created a row that could
-- never be matched: their project stayed orphaned forever.
--
-- The form now normalises before saving, but rows written BEFORE that fix are
-- still stranded. This migration:
--   1. normalises every existing pending_projects.email,
--   2. makes claim_pending_projects() compare case-insensitively (belt and
--      braces — a row written by an older client can never strand again),
--   3. runs a one-time backfill that claims every still-unclaimed row whose
--      email now matches a real, confirmed account.
--
-- Safe to re-run: every step is idempotent and already-claimed rows are
-- skipped.
-- ---------------------------------------------------------------------------

-- 1. Normalise historical rows -------------------------------------------------
UPDATE public.pending_projects
   SET email = lower(btrim(email))
 WHERE email <> lower(btrim(email));

-- Keep the partial index aligned with the new comparison.
CREATE INDEX IF NOT EXISTS pending_projects_email_lower_unclaimed_idx
  ON public.pending_projects (lower(btrim(email)))
  WHERE claimed_at IS NULL;

-- 2. Case-insensitive claim function ------------------------------------------
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

  SELECT lower(btrim(email)) INTO caller_email FROM auth.users WHERE id = caller_id;
  IF caller_email IS NULL OR caller_email = '' THEN
    RETURN;
  END IF;

  FOR rec IN
    SELECT * FROM public.pending_projects
    WHERE lower(btrim(email)) = caller_email AND claimed_at IS NULL
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
REVOKE EXECUTE ON FUNCTION public.claim_pending_projects() FROM anon;

-- 3. One-time backfill for people who already registered ----------------------
-- Matches orphaned pending rows to confirmed accounts and moves them into
-- `jobs`, exactly as the RPC would have done had the person signed up today.
DO $backfill$
DECLARE
  rec record;
  new_job_id uuid;
  moved integer := 0;
BEGIN
  FOR rec IN
    SELECT pp.id,
           pp.title,
           pp.description,
           pp.trade,
           pp.estimated_budget,
           pp.location_zip,
           pp.city,
           pp.language,
           pp.urgency,
           u.id AS owner_id
      FROM public.pending_projects pp
      JOIN auth.users u
        ON lower(btrim(u.email)) = lower(btrim(pp.email))
     WHERE pp.claimed_at IS NULL
       AND u.email_confirmed_at IS NOT NULL
     ORDER BY pp.created_at ASC
  LOOP
    -- Don't duplicate a project the owner already has under the same title.
    IF EXISTS (
      SELECT 1 FROM public.jobs j
       WHERE j.owner_id = rec.owner_id
         AND j.title = rec.title
    ) THEN
      UPDATE public.pending_projects
         SET claimed_at = now()
       WHERE id = rec.id;
      CONTINUE;
    END IF;

    INSERT INTO public.jobs (
      owner_id, title, description, trade, estimated_budget,
      location_zip, city, language, urgency, status
    ) VALUES (
      rec.owner_id, rec.title, rec.description, rec.trade, rec.estimated_budget,
      rec.location_zip, rec.city, rec.language, rec.urgency, 'open'
    )
    RETURNING id INTO new_job_id;

    UPDATE public.pending_projects
       SET claimed_at = now(), claimed_job_id = new_job_id
     WHERE id = rec.id;

    moved := moved + 1;
  END LOOP;

  RAISE NOTICE 'pending_projects backfill: % project(s) reunited with their owner', moved;
END
$backfill$;
