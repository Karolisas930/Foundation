DO $$
BEGIN
  IF to_regclass('public.team_members') IS NOT NULL THEN
    ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS hourly_rate numeric;
  END IF;
END $$;