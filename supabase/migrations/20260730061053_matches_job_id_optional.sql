-- The browse/profile-view flow (routes/p.$profileId.tsx -> requestMatch)
-- creates a match with only contractor_id + client_id - there is no job
-- posting selected at that point in the product flow. But matches.job_id
-- has been NOT NULL since the very first migration, so that insert fails
-- against the real database.
--
-- Rather than force a "pick or create a job first" flow before a homeowner
-- can even message a contractor, make job_id optional: a match with no job
-- attached is a legitimate "just reaching out" pairing. Matches created via
-- the job/quote flow (sendQuote, requestJobMatch, etc.) continue to set
-- job_id as before and are unaffected by this change.

ALTER TABLE public.matches
  ALTER COLUMN job_id DROP NOT NULL;
