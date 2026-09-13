-- ==========================================
-- 1. Staff Hours Table, Index & Policies
-- ==========================================
CREATE TABLE IF NOT EXISTS public.staff_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  member_name TEXT,
  work_date DATE NOT NULL,
  hours NUMERIC(6,2) NOT NULL CHECK (hours >= 0),
  notes TEXT,
  job TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_hours_owner ON public.staff_hours(owner_id, work_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_hours TO authenticated;
GRANT ALL ON public.staff_hours TO service_role;

ALTER TABLE public.staff_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can manage staff_hours" ON public.staff_hours;
CREATE POLICY "Owner can manage staff_hours"
  ON public.staff_hours FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);


-- ==========================================
-- 2. Staff GPS Pings Table, Index & Policies
-- ==========================================
CREATE TABLE IF NOT EXISTS public.staff_gps_pings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  member_name TEXT,
  job TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_gps_owner_time ON public.staff_gps_pings(owner_id, recorded_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_gps_pings TO authenticated;
GRANT ALL ON public.staff_gps_pings TO service_role;

ALTER TABLE public.staff_gps_pings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can manage staff_gps_pings" ON public.staff_gps_pings;
CREATE POLICY "Owner can manage staff_gps_pings"
  ON public.staff_gps_pings FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);


-- ==========================================
-- 3. Shared Triggers & Helpers
-- ==========================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_staff_hours_updated_at ON public.staff_hours;
CREATE TRIGGER trg_staff_hours_updated_at
  BEFORE UPDATE ON public.staff_hours
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
