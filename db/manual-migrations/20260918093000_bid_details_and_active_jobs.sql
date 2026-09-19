-- Run this against YOUR local Supabase AFTER
-- 20260918092000_properties_bids_project_chat.sql, e.g.
--   psql "$DATABASE_URL" -f db/manual-migrations/20260918093000_bid_details_and_active_jobs.sql
-- It is idempotent.
--
-- Audit fixes, part 2 (read paths).
--
-- Part 1 created the tables. The app now needs three read paths that cross
-- RLS boundaries (a homeowner must see the *name* of a contractor who bid on
-- their job; a contractor must see the title of a job that is already awarded
-- and therefore no longer in the public feed). Each is a SECURITY DEFINER
-- function that re-checks the caller itself, so no table policy has to be
-- widened.

-- ------------------------------------------------- bids on one of my jobs
-- Caller must own the job. Returns every non-draft bid plus the bidder's
-- public identity.
CREATE OR REPLACE FUNCTION public.job_bid_details(_job_id uuid)
RETURNS TABLE (
  id uuid,
  job_id uuid,
  contractor_id uuid,
  labor_cents integer,
  materials_cents integer,
  travel_cents integer,
  message text,
  timeline_days integer,
  valid_until date,
  status text,
  sent_at timestamptz,
  created_at timestamptz,
  contractor_name text,
  contractor_city text,
  contractor_avatar_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = _job_id AND j.owner_id = caller_id) THEN
    RAISE EXCEPTION 'Only the project owner can list bids for this job';
  END IF;

  RETURN QUERY
  SELECT b.id, b.job_id, b.contractor_id, b.labor_cents, b.materials_cents,
         b.travel_cents, b.message, b.timeline_days, b.valid_until, b.status,
         b.sent_at, b.created_at,
         COALESCE(NULLIF(p.company_name, ''), NULLIF(p.display_name, ''),
                  NULLIF(p.full_name, ''), 'Contractor') AS contractor_name,
         p.city AS contractor_city,
         p.avatar_url AS contractor_avatar_url
  FROM public.job_bids b
  LEFT JOIN public.profiles p ON p.id = b.contractor_id
  WHERE b.job_id = _job_id
    AND b.status <> 'draft'
  ORDER BY b.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.job_bid_details(uuid) TO authenticated;

-- --------------------------------------------------------- my own bids
-- Contractor-side "Quotes" list: every bid I placed, with the job context
-- even when the job has since left the public feed.
CREATE OR REPLACE FUNCTION public.my_job_bids()
RETURNS TABLE (
  id uuid,
  job_id uuid,
  labor_cents integer,
  materials_cents integer,
  travel_cents integer,
  message text,
  timeline_days integer,
  valid_until date,
  status text,
  sent_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  job_title text,
  job_city text,
  job_zip text,
  job_trade text,
  job_status text,
  job_budget numeric,
  owner_id uuid,
  owner_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT b.id, b.job_id, b.labor_cents, b.materials_cents, b.travel_cents,
         b.message, b.timeline_days, b.valid_until, b.status, b.sent_at,
         b.created_at, b.updated_at,
         j.title, j.city, j.location_zip, j.trade, j.status,
         j.estimated_budget::numeric,
         j.owner_id,
         COALESCE(NULLIF(p.display_name, ''), NULLIF(p.full_name, ''), 'Client') AS owner_name
  FROM public.job_bids b
  JOIN public.jobs j ON j.id = b.job_id
  LEFT JOIN public.profiles p ON p.id = j.owner_id
  WHERE b.contractor_id = caller_id
  ORDER BY b.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.my_job_bids() TO authenticated;

-- ------------------------------------------------------- my active jobs
-- Contractor-side "Active jobs": confirmed bookings awarded to me.
CREATE OR REPLACE FUNCTION public.my_active_jobs()
RETURNS TABLE (
  booking_id uuid,
  job_id uuid,
  match_id uuid,
  status text,
  agreed_price_cents integer,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz,
  job_title text,
  job_city text,
  job_zip text,
  job_trade text,
  client_id uuid,
  client_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT bk.id, bk.job_id, bk.match_id, bk.status, bk.agreed_price_cents,
         bk.scheduled_start, bk.scheduled_end, bk.completed_at, bk.notes,
         bk.created_at,
         j.title, j.city, j.location_zip, j.trade,
         bk.client_id,
         COALESCE(NULLIF(p.display_name, ''), NULLIF(p.full_name, ''), 'Client') AS client_name
  FROM public.bookings bk
  LEFT JOIN public.jobs j ON j.id = bk.job_id
  LEFT JOIN public.profiles p ON p.id = bk.client_id
  WHERE bk.provider_id = caller_id
  ORDER BY bk.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.my_active_jobs() TO authenticated;

-- ------------------------------------------- project chat participant view
-- A homeowner may chat with any contractor who has bid on their job, and a
-- contractor may chat with the owner of a job they bid on — before any
-- booking exists. Returns the peer's public identity when that pairing is
-- legitimate, NULL otherwise.
CREATE OR REPLACE FUNCTION public.job_chat_peer(_job_id uuid, _peer_id uuid)
RETURNS TABLE (peer_id uuid, peer_name text, peer_city text, is_owner boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  job record;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO job FROM public.jobs WHERE id = _job_id;
  IF job IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  -- caller is the owner talking to a bidder
  IF job.owner_id = caller_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.job_bids b
      WHERE b.job_id = _job_id AND b.contractor_id = _peer_id AND b.status <> 'draft'
    ) THEN
      RAISE EXCEPTION 'That contractor has not bid on this project';
    END IF;
  -- caller is a bidder talking to the owner
  ELSIF EXISTS (
    SELECT 1 FROM public.job_bids b
    WHERE b.job_id = _job_id AND b.contractor_id = caller_id AND b.status <> 'draft'
  ) THEN
    IF _peer_id <> job.owner_id THEN
      RAISE EXCEPTION 'Contractors can only message the project owner';
    END IF;
  ELSE
    RAISE EXCEPTION 'Not a participant of this project';
  END IF;

  RETURN QUERY
  SELECT p.id,
         COALESCE(NULLIF(p.company_name, ''), NULLIF(p.display_name, ''),
                  NULLIF(p.full_name, ''), 'User') AS peer_name,
         p.city,
         (job.owner_id = _peer_id) AS is_owner
  FROM public.profiles p
  WHERE p.id = _peer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.job_chat_peer(uuid, uuid) TO authenticated;
