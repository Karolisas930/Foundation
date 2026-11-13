-- Km tracker: let contractors flag a saved trip for correction.
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS correction_requested boolean NOT NULL DEFAULT false;
