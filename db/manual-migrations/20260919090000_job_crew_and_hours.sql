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
