-- Fixes the public-profile viewing/browsing feature. The application code
-- (privacy-gate.functions.ts, routes/p.$profileId.tsx) already calls an RPC
-- named get_public_profile and reads columns like business_name, trade,
-- website_url, instagram_handle, phone_e164 — none of which exist in any
-- prior migration. The real profiles columns are company_name, trades
-- (a text[] array), and there was no website/Instagram column at all.
--
-- This adds the two missing contact columns and creates get_public_profile
-- (single row, used by /p/:profileId) plus list_public_profiles (used by
-- the new homeowner "Find a Tradesperson" browse page), both SECURITY
-- DEFINER so anonymous visitors can browse/view profiles without any
-- direct table grant, and both aliasing the real columns to the names the
-- app already expects.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS instagram_handle text;

CREATE OR REPLACE FUNCTION public.get_public_profile(_profile_id uuid)
RETURNS TABLE (
  id uuid,
  business_name text,
  trade text,
  city text,
  bio text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    COALESCE(p.company_name, p.display_name, p.full_name) AS business_name,
    NULLIF(array_to_string(p.trades, ', '), '') AS trade,
    p.city,
    p.bio,
    p.created_at
  FROM public.profiles p
  WHERE p.id = _profile_id
    AND COALESCE(p.account_type, 'handyman') <> 'homeowner'
    AND p.flagged = false;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_public_profiles(_search text DEFAULT NULL, _limit integer DEFAULT 24)
RETURNS TABLE (
  id uuid,
  business_name text,
  trade text,
  city text,
  bio text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    COALESCE(p.company_name, p.display_name, p.full_name) AS business_name,
    NULLIF(array_to_string(p.trades, ', '), '') AS trade,
    p.city,
    p.bio,
    p.created_at
  FROM public.profiles p
  WHERE COALESCE(p.account_type, 'handyman') <> 'homeowner'
    AND p.flagged = false
    AND (
      _search IS NULL OR _search = ''
      OR p.city ILIKE '%' || _search || '%'
      OR COALESCE(p.company_name, p.display_name, p.full_name) ILIKE '%' || _search || '%'
      OR EXISTS (SELECT 1 FROM unnest(p.trades) AS t WHERE t ILIKE '%' || _search || '%')
    )
  ORDER BY p.created_at DESC
  LIMIT LEAST(GREATEST(_limit, 1), 50);
$$;

GRANT EXECUTE ON FUNCTION public.list_public_profiles(text, integer) TO anon, authenticated;
