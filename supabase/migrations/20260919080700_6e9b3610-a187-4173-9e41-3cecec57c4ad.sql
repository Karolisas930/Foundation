CREATE OR REPLACE FUNCTION public.__tmp_apply_sql(q text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  EXECUTE q;
END;
$fn$;
REVOKE ALL ON FUNCTION public.__tmp_apply_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.__tmp_apply_sql(text) TO sandbox_exec;