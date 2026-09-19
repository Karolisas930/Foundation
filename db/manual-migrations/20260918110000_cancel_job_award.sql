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
