-- Phase 2: project photos / voice memos live in Cloudflare R2.
-- Only the object keys are stored here, so attachments survive refresh,
-- logout and other devices.
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS media_keys text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.pending_projects ADD COLUMN IF NOT EXISTS media_keys text[] NOT NULL DEFAULT '{}';

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
  IF caller_id IS NULL THEN RETURN; END IF;
  SELECT lower(btrim(email)) INTO caller_email FROM auth.users WHERE id = caller_id;
  IF caller_email IS NULL OR caller_email = '' THEN RETURN; END IF;

  FOR rec IN
    SELECT * FROM public.pending_projects
    WHERE lower(btrim(email)) = caller_email AND claimed_at IS NULL
    ORDER BY created_at ASC
  LOOP
    INSERT INTO public.jobs (
      owner_id, title, description, trade, estimated_budget,
      location_zip, city, language, urgency, status, media_keys
    ) VALUES (
      caller_id, rec.title, rec.description, rec.trade, rec.estimated_budget,
      rec.location_zip, rec.city, rec.language, rec.urgency, 'open',
      coalesce(rec.media_keys, '{}')
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
