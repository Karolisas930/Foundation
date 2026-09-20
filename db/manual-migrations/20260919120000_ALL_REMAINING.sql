-- =====================================================================
-- Consolidated "everything still missing" migration.
--
-- Run this ONCE against the project database (Supabase SQL editor or
-- `psql "$DATABASE_URL" -f <this file>`). It is idempotent: safe to run
-- again, and safe to run on a database where some objects already exist.
--
-- It folds in every script that previously lived in db/manual-migrations/
-- (properties, job_bids, project chat, accept_job_bid, job_bid_details,
-- my_job_bids, my_active_jobs, cancel_job_award, site_visits, job_crew and
-- job_hours) and adds the three matching helper functions the app calls but
-- that no migration ever created: match_job_to_worker, get_match_contact and
-- get_match_bank_details.
--
-- Prerequisites: the base schema (profiles, jobs, matches, bookings,
-- messages, notifications, invoices, receipts, verifications, staff_hours)
-- from the earlier files in supabase/migrations/.
-- =====================================================================



-- =====================================================================
-- SECTION: 20260918092000_properties_bids_project_chat.sql
-- =====================================================================

-- Run this against YOUR local Supabase (e.g. `psql "$DATABASE_URL" -f
-- db/manual-migrations/20260918092000_properties_bids_project_chat.sql`
-- or paste it into the local Studio SQL editor). It is idempotent.
--
-- Audit fixes, part 1 (schema).
--
-- 1. `properties` — the missing buildings/properties concept. A homeowner (or
--    property manager) owns one or more buildings; a job can optionally be
--    attached to one, so contractors see where the work actually happens.
-- 2. `job_bids` — real contractor bids/quotes on a job. Until now quotes,
--    leads and "proposals" only existed in a per-browser demo store, so a
--    contractor's quote never reached the homeowner and the homeowner's bid
--    list was always empty.
-- 3. `messages.job_id` — lets a homeowner chat with a bidder about a project
--    before any booking exists (booking_id stays nullable).
-- 4. `accept_job_bid()` — atomically award a project: accept one bid, decline
--    the rest, mark the job awarded, and create the match + booking rows the
--    rest of the app already relies on.

-- ---------------------------------------------------------------- properties
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label text NOT NULL,
  property_type text NOT NULL DEFAULT 'house',
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  country text NOT NULL DEFAULT 'DE',
  year_built integer,
  size_sqm integer,
  units integer NOT NULL DEFAULT 1,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS properties_owner_idx ON public.properties(owner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS properties_select_own ON public.properties;
CREATE POLICY properties_select_own ON public.properties
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS properties_insert_own ON public.properties;
CREATE POLICY properties_insert_own ON public.properties
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS properties_update_own ON public.properties;
CREATE POLICY properties_update_own ON public.properties
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS properties_delete_own ON public.properties;
CREATE POLICY properties_delete_own ON public.properties
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS properties_set_updated_at ON public.properties;
CREATE TRIGGER properties_set_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- jobs -> property
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS jobs_property_idx ON public.jobs(property_id);

-- ----------------------------------------------------------------- job_bids
CREATE TABLE IF NOT EXISTS public.job_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  labor_cents integer NOT NULL DEFAULT 0,
  materials_cents integer NOT NULL DEFAULT 0,
  travel_cents integer NOT NULL DEFAULT 0,
  message text,
  timeline_days integer,
  valid_until date,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'withdrawn')),
  sent_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, contractor_id)
);

CREATE INDEX IF NOT EXISTS job_bids_job_idx ON public.job_bids(job_id);
CREATE INDEX IF NOT EXISTS job_bids_contractor_idx ON public.job_bids(contractor_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_bids TO authenticated;
GRANT ALL ON public.job_bids TO service_role;

ALTER TABLE public.job_bids ENABLE ROW LEVEL SECURITY;

-- A contractor always sees their own bids (including drafts). A homeowner
-- sees every non-draft bid placed on a job they own.
DROP POLICY IF EXISTS job_bids_select_participants ON public.job_bids;
CREATE POLICY job_bids_select_participants ON public.job_bids
  FOR SELECT TO authenticated
  USING (
    auth.uid() = contractor_id
    OR (
      status <> 'draft'
      AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS job_bids_insert_contractor ON public.job_bids;
CREATE POLICY job_bids_insert_contractor ON public.job_bids
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = contractor_id);

DROP POLICY IF EXISTS job_bids_update_contractor ON public.job_bids;
CREATE POLICY job_bids_update_contractor ON public.job_bids
  FOR UPDATE TO authenticated
  USING (auth.uid() = contractor_id)
  WITH CHECK (auth.uid() = contractor_id);

-- The job owner may decline bids on their own job.
DROP POLICY IF EXISTS job_bids_update_owner ON public.job_bids;
CREATE POLICY job_bids_update_owner ON public.job_bids
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.owner_id = auth.uid()));

DROP POLICY IF EXISTS job_bids_delete_contractor ON public.job_bids;
CREATE POLICY job_bids_delete_contractor ON public.job_bids
  FOR DELETE TO authenticated USING (auth.uid() = contractor_id);

DROP TRIGGER IF EXISTS job_bids_set_updated_at ON public.job_bids;
CREATE TRIGGER job_bids_set_updated_at BEFORE UPDATE ON public.job_bids
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------ project chat
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS messages_job_idx ON public.messages(job_id);

-- --------------------------------------------------------- accept_job_bid()
CREATE OR REPLACE FUNCTION public.accept_job_bid(_bid_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  bid record;
  job record;
  new_match_id uuid;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO bid FROM public.job_bids WHERE id = _bid_id;
  IF bid IS NULL THEN
    RAISE EXCEPTION 'Bid not found';
  END IF;

  SELECT * INTO job FROM public.jobs WHERE id = bid.job_id;
  IF job IS NULL OR job.owner_id <> caller_id THEN
    RAISE EXCEPTION 'Only the project owner can accept a bid';
  END IF;

  UPDATE public.job_bids
    SET status = 'accepted', decided_at = now()
    WHERE id = bid.id;

  UPDATE public.job_bids
    SET status = 'declined', decided_at = now()
    WHERE job_id = bid.job_id AND id <> bid.id AND status IN ('draft', 'sent');

  UPDATE public.jobs SET status = 'awarded' WHERE id = bid.job_id;

  INSERT INTO public.matches (job_id, client_id, contractor_id, status, accepted_at, client_accepted_at)
  VALUES (bid.job_id, caller_id, bid.contractor_id, 'accepted', now(), now())
  ON CONFLICT (job_id, contractor_id) DO UPDATE
    SET status = 'accepted', accepted_at = now(), client_accepted_at = now()
  RETURNING id INTO new_match_id;

  INSERT INTO public.bookings (job_id, match_id, client_id, provider_id, status, agreed_price_cents, notes)
  VALUES (
    bid.job_id, new_match_id, caller_id, bid.contractor_id, 'confirmed',
    bid.labor_cents + bid.materials_cents + bid.travel_cents, bid.message
  );

  RETURN bid.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_job_bid(uuid) TO authenticated;


-- =====================================================================
-- SECTION: 20260918093000_bid_details_and_active_jobs.sql
-- =====================================================================

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


-- =====================================================================
-- SECTION: 20260918110000_cancel_job_award.sql
-- =====================================================================

-- Run after 20260918093000_bid_details_and_active_jobs.sql
--
-- cancel_job_award(): the homeowner reverses an accepted bid. The bid goes
-- back to 'declined' (with the reason), the job re-opens for new bids, and
-- the match + booking created by accept_job_bid() are marked cancelled.

CREATE OR REPLACE FUNCTION public.cancel_job_award(_bid_id uuid, _reason text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  bid record;
  job record;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO bid FROM public.job_bids WHERE id = _bid_id;
  IF bid IS NULL THEN
    RAISE EXCEPTION 'Bid not found';
  END IF;
  IF bid.status <> 'accepted' THEN
    RAISE EXCEPTION 'Only an accepted bid can be cancelled';
  END IF;

  SELECT * INTO job FROM public.jobs WHERE id = bid.job_id;
  IF job IS NULL OR job.owner_id <> caller_id THEN
    RAISE EXCEPTION 'Only the project owner can cancel an award';
  END IF;

  UPDATE public.job_bids
    SET status = 'declined', decided_at = now()
    WHERE id = bid.id;

  UPDATE public.jobs SET status = 'open' WHERE id = bid.job_id;

  UPDATE public.matches
    SET status = 'cancelled'
    WHERE job_id = bid.job_id AND contractor_id = bid.contractor_id;

  UPDATE public.bookings
    SET status = 'cancelled'
    WHERE job_id = bid.job_id AND provider_id = bid.contractor_id;

  -- Best-effort notification to the contractor.
  BEGIN
    INSERT INTO public.notifications (recipient_id, sender_id, type, message, metadata)
    VALUES (
      bid.contractor_id, caller_id, 'bid_cancelled',
      COALESCE(left(_reason, 240), 'The homeowner cancelled the acceptance of your bid.'),
      jsonb_build_object('job_id', bid.job_id, 'bid_id', bid.id)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN bid.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_job_award(uuid, text) TO authenticated;


-- =====================================================================
-- SECTION: 20260918120000_site_visits.sql
-- =====================================================================

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


-- =====================================================================
-- SECTION: 20260919090000_job_crew_and_hours.sql
-- =====================================================================

-- Contractor crew assignments + logged working hours move from per-browser
-- localStorage into the database, scoped to the contractor who owns the booking.
--
-- Apply this against the connected Supabase project (SQL editor or CLI).

CREATE TABLE IF NOT EXISTS public.job_crew (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, member_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_crew TO authenticated;
GRANT ALL ON public.job_crew TO service_role;

ALTER TABLE public.job_crew ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers manage their own job crew" ON public.job_crew;
CREATE POLICY "Providers manage their own job crew"
  ON public.job_crew
  FOR ALL
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE INDEX IF NOT EXISTS job_crew_provider_idx ON public.job_crew (provider_id);
CREATE INDEX IF NOT EXISTS job_crew_booking_idx ON public.job_crew (booking_id);

CREATE TABLE IF NOT EXISTS public.job_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_name text NOT NULL DEFAULT 'Me',
  hours numeric(6, 2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  work_date date NOT NULL DEFAULT current_date,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_hours TO authenticated;
GRANT ALL ON public.job_hours TO service_role;

ALTER TABLE public.job_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers manage their own logged hours" ON public.job_hours;
CREATE POLICY "Providers manage their own logged hours"
  ON public.job_hours
  FOR ALL
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE INDEX IF NOT EXISTS job_hours_provider_idx ON public.job_hours (provider_id);
CREATE INDEX IF NOT EXISTS job_hours_booking_idx ON public.job_hours (booking_id);


-- =====================================================================
-- SECTION: matching helper functions (previously missing entirely)
--
-- The app calls these three RPCs; no migration ever created them, so every
-- call failed with "function does not exist".
-- =====================================================================

-- --------------------------------------------------- match_job_to_worker()
-- Scores a job/worker pair 0-100:
--   budget  35 — job budget vs the worker's minimum project size
--   sector  30 — job trade present in the worker's trades[]
--   distance25 — postal-code proximity within the worker's service radius
--   urgency 10 — urgent jobs score higher for workers who take them
-- Read-only: it never writes a row.
CREATE OR REPLACE FUNCTION public.match_job_to_worker(_job_id uuid, _worker_id uuid)
RETURNS TABLE (
  score integer,
  budget_score integer,
  sector_score integer,
  distance_score integer,
  urgency_score integer,
  distance_km numeric,
  breakdown jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  j record;
  w record;
  s_budget integer := 0;
  s_sector integer := 0;
  s_distance integer := 0;
  s_urgency integer := 0;
  est_km numeric := NULL;
  shared_prefix integer := 0;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, owner_id, trade, estimated_budget, location_zip, city, urgency
    INTO j FROM public.jobs WHERE id = _job_id;
  IF j IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  -- Only the job owner or the worker themselves may score this pair.
  IF caller_id <> j.owner_id AND caller_id <> _worker_id THEN
    RAISE EXCEPTION 'Not allowed to score this job/worker pair';
  END IF;

  SELECT id, trades, min_project_size, service_radius_km, postal_code, city
    INTO w FROM public.profiles WHERE id = _worker_id;
  IF w IS NULL THEN
    RAISE EXCEPTION 'Worker profile not found';
  END IF;

  -- budget (max 35)
  IF j.estimated_budget IS NULL THEN
    s_budget := 18;                                   -- unknown budget: neutral
  ELSIF COALESCE(w.min_project_size, 0) = 0 THEN
    s_budget := 30;
  ELSIF j.estimated_budget >= w.min_project_size * 2 THEN
    s_budget := 35;
  ELSIF j.estimated_budget >= w.min_project_size THEN
    s_budget := 28;
  ELSE
    s_budget := GREATEST(
      0,
      ROUND(35.0 * j.estimated_budget / NULLIF(w.min_project_size, 0))::integer / 2
    );
  END IF;

  -- sector / trade (max 30)
  IF j.trade IS NULL THEN
    s_sector := 10;
  ELSIF w.trades IS NOT NULL AND j.trade = ANY (w.trades) THEN
    s_sector := 30;
  ELSE
    s_sector := 0;
  END IF;

  -- distance (max 25) — no geocoding available, so postal-code prefix is used
  -- as a coarse proximity proxy and converted to a rough km estimate.
  IF j.location_zip IS NULL OR w.postal_code IS NULL THEN
    IF j.city IS NOT NULL AND w.city IS NOT NULL
       AND lower(trim(j.city)) = lower(trim(w.city)) THEN
      s_distance := 20;
      est_km := 10;
    ELSE
      s_distance := 10;
    END IF;
  ELSE
    WHILE shared_prefix < LEAST(length(j.location_zip), length(w.postal_code))
          AND substr(j.location_zip, shared_prefix + 1, 1)
              = substr(w.postal_code, shared_prefix + 1, 1) LOOP
      shared_prefix := shared_prefix + 1;
    END LOOP;

    est_km := CASE shared_prefix
                WHEN 0 THEN 400
                WHEN 1 THEN 150
                WHEN 2 THEN 50
                WHEN 3 THEN 15
                ELSE 3
              END;

    IF est_km <= COALESCE(w.service_radius_km, 50) THEN
      -- closer postal codes (longer shared prefix) score higher
      s_distance := CASE
                      WHEN shared_prefix >= 4 THEN 25
                      WHEN shared_prefix = 3 THEN 22
                      WHEN shared_prefix = 2 THEN 18
                      WHEN shared_prefix = 1 THEN 12
                      ELSE 6
                    END;
    ELSE
      s_distance := 0;
    END IF;
  END IF;

  -- urgency (max 10)
  s_urgency := CASE lower(COALESCE(j.urgency, 'normal'))
                 WHEN 'emergency' THEN 10
                 WHEN 'urgent' THEN 9
                 WHEN 'normal' THEN 6
                 WHEN 'flexible' THEN 4
                 ELSE 5
               END;

  RETURN QUERY SELECT
    LEAST(100, s_budget + s_sector + s_distance + s_urgency),
    s_budget, s_sector, s_distance, s_urgency, est_km,
    jsonb_build_object(
      'budget', jsonb_build_object('score', s_budget, 'max', 35,
        'job_budget', j.estimated_budget, 'worker_min', w.min_project_size),
      'sector', jsonb_build_object('score', s_sector, 'max', 30,
        'job_trade', j.trade, 'worker_trades', to_jsonb(w.trades)),
      'distance', jsonb_build_object('score', s_distance, 'max', 25,
        'estimated_km', est_km, 'radius_km', w.service_radius_km),
      'urgency', jsonb_build_object('score', s_urgency, 'max', 10,
        'job_urgency', j.urgency)
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.match_job_to_worker(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_job_to_worker(uuid, uuid) TO authenticated;


-- ------------------------------------------------------ get_match_contact()
-- Contact reveal. Only a party to the match may call it, and only once the
-- match is unlocked. Returns the OTHER party's contact details, never the
-- caller's own and never anyone else's.
CREATE OR REPLACE FUNCTION public.get_match_contact(_match_id uuid)
RETURNS TABLE (
  match_id uuid,
  counterparty_id uuid,
  full_name text,
  display_name text,
  email text,
  phone text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  country text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  m record;
  other_id uuid;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, client_id, contractor_id, status, match_unlocked
    INTO m FROM public.matches WHERE id = _match_id;
  IF m IS NULL THEN
    RETURN;                                  -- no row: caller learns nothing
  END IF;
  IF caller_id <> m.client_id AND caller_id <> m.contractor_id THEN
    RETURN;
  END IF;
  IF NOT m.match_unlocked THEN
    RETURN;
  END IF;

  other_id := CASE WHEN caller_id = m.client_id THEN m.contractor_id ELSE m.client_id END;

  RETURN QUERY
  SELECT m.id, p.id, p.full_name, p.display_name,
         u.email::text, p.phone, p.address_line1, p.address_line2,
         p.postal_code, p.city, p.country
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.id = other_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_match_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_match_contact(uuid) TO authenticated;


-- ------------------------------------------------- get_match_bank_details()
-- Direct bank payment. ONLY the homeowner (client) on an accepted, unlocked
-- match may read the tradesperson's bank details.
CREATE OR REPLACE FUNCTION public.get_match_bank_details(_match_id uuid)
RETURNS TABLE (
  match_id uuid,
  contractor_id uuid,
  company_name text,
  bank_account_holder text,
  bank_iban text,
  bank_bic text,
  bank_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  m record;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, client_id, contractor_id, status, match_unlocked
    INTO m FROM public.matches WHERE id = _match_id;
  IF m IS NULL OR caller_id <> m.client_id THEN
    RETURN;
  END IF;
  IF NOT m.match_unlocked OR m.status NOT IN ('accepted', 'booked', 'completed') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT m.id, p.id, p.company_name, p.bank_account_holder,
         p.bank_iban, p.bank_bic, p.bank_name
  FROM public.profiles p
  WHERE p.id = m.contractor_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_match_bank_details(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_match_bank_details(uuid) TO authenticated;
