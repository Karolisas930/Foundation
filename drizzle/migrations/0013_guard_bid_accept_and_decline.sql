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
  existing_booking uuid;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock the bid so two simultaneous clicks cannot both award the job.
  SELECT * INTO bid FROM public.job_bids WHERE id = _bid_id FOR UPDATE;
  IF bid IS NULL THEN
    RAISE EXCEPTION 'Bid not found';
  END IF;

  SELECT * INTO job FROM public.jobs WHERE id = bid.job_id FOR UPDATE;
  IF job IS NULL OR job.owner_id <> caller_id THEN
    RAISE EXCEPTION 'Only the project owner can accept a bid';
  END IF;

  IF bid.status = 'accepted' THEN
    RAISE EXCEPTION 'This bid has already been accepted';
  END IF;

  IF bid.status IN ('declined', 'withdrawn') THEN
    RAISE EXCEPTION 'This bid is no longer open';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.job_bids
    WHERE job_id = bid.job_id AND id <> bid.id AND status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'This project has already been awarded to another contractor';
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

  SELECT id INTO existing_booking
  FROM public.bookings
  WHERE job_id = bid.job_id
    AND provider_id = bid.contractor_id
    AND status <> 'cancelled'
  LIMIT 1;

  IF existing_booking IS NULL THEN
    INSERT INTO public.bookings (job_id, match_id, client_id, provider_id, status, agreed_price_cents, notes)
    VALUES (
      bid.job_id, new_match_id, caller_id, bid.contractor_id, 'confirmed',
      bid.labor_cents + bid.materials_cents + bid.travel_cents, bid.message
    );
  END IF;

  RETURN bid.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_job_bid(_bid_id uuid)
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

  SELECT * INTO bid FROM public.job_bids WHERE id = _bid_id FOR UPDATE;
  IF bid IS NULL THEN
    RAISE EXCEPTION 'Bid not found';
  END IF;

  SELECT * INTO job FROM public.jobs WHERE id = bid.job_id;
  IF job IS NULL OR job.owner_id <> caller_id THEN
    RAISE EXCEPTION 'Only the project owner can decline a bid';
  END IF;

  IF bid.status = 'accepted' THEN
    RAISE EXCEPTION 'This bid was already accepted — cancel the award first';
  END IF;

  IF bid.status = 'declined' THEN
    RETURN bid.id;
  END IF;

  UPDATE public.job_bids
    SET status = 'declined', decided_at = now()
    WHERE id = bid.id;

  RETURN bid.id;
END;
$$;

REVOKE ALL ON FUNCTION public.decline_job_bid(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decline_job_bid(uuid) TO authenticated;