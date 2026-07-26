-- =============================================================================
-- Phase 1 (Product Blueprint) — RLS fix for public.profiles
--
-- Restricts the raw `profiles` table to be readable only by the owner,
-- and creates a safe `profiles_public` view for marketplace browsing that
-- exposes only non-sensitive columns.
-- =============================================================================

-- Restrict the raw table to owner-only.
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- A safe public view for marketplace browsing — only non-sensitive columns.
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT id, display_name, full_name, avatar_url, account_type, city,
       trades, languages, service_radius_km, bio
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated, anon;