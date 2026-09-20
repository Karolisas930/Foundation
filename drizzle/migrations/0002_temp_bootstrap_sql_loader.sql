CREATE OR REPLACE FUNCTION public.__bootstrap_exec_sql(_sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE _sql;
END;
$$;

REVOKE ALL ON FUNCTION public.__bootstrap_exec_sql(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.__bootstrap_exec_sql(text) FROM anon;
REVOKE ALL ON FUNCTION public.__bootstrap_exec_sql(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.__bootstrap_exec_sql(text) TO service_role;