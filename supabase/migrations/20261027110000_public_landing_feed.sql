-- Public landing-page data: real open jobs and real stats, no demo data.
-- SECURITY DEFINER so anonymous visitors can see the live feed without a
-- direct table grant; only safe columns are exposed (no owner, zip, description).

CREATE OR REPLACE FUNCTION public.list_public_open_jobs(_limit integer DEFAULT 12)
RETURNS TABLE (id uuid, title text, trade text, city text, estimated_budget numeric, status text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT j.id, j.title, j.trade, j.city, j.estimated_budget::numeric, j.status::text, j.created_at
  FROM public.jobs j
  WHERE j.status::text IN ('open', 'clarifying')
  ORDER BY j.created_at DESC
  LIMIT LEAST(GREATEST(_limit, 1), 50);
$$;
GRANT EXECUTE ON FUNCTION public.list_public_open_jobs(integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_landing_stats()
RETURNS TABLE (open_jobs bigint, pros bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM public.jobs WHERE status::text = 'open'),
    (SELECT count(*) FROM public.profiles p
       WHERE COALESCE(p.account_type, 'handyman') <> 'homeowner' AND p.flagged = false);
$$;
GRANT EXECUTE ON FUNCTION public.get_public_landing_stats() TO anon, authenticated;
