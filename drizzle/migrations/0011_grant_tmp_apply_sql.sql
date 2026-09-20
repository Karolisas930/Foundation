DROP FUNCTION IF EXISTS public.__tmp_apply_sql(text);
CREATE FUNCTION public.__tmp_apply_sql(_sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE _sql;
END;
$$;
REVOKE ALL ON FUNCTION public.__tmp_apply_sql(text) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sandbox_exec') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.__tmp_apply_sql(text) TO sandbox_exec';
  END IF;
END $$;