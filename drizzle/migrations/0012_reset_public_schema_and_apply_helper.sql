DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres;

CREATE FUNCTION public.__apply_sql(_sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE _sql;
END;
$$;
REVOKE ALL ON FUNCTION public.__apply_sql(text) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sandbox_exec') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.__apply_sql(text) TO sandbox_exec';
    EXECUTE 'REVOKE CREATE ON SCHEMA public FROM sandbox_exec';
  END IF;
END $$;