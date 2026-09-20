-- Quotes: keep the full quote document (line items, client, notes) alongside
-- the money columns so the contractor Quotes screen can round-trip a bid.
-- Safe to re-run.

ALTER TABLE public.job_bids
  ADD COLUMN IF NOT EXISTS details jsonb;

COMMENT ON COLUMN public.job_bids.details IS
  'Quote document for this bid: { number, clientName, clientEmail, jobTitle, description, items[], validDays, notes }';
