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
