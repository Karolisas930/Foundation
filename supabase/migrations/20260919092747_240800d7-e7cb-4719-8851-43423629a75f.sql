CREATE OR REPLACE FUNCTION public.__setup_apply(p_token text, q text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF p_token <> 'k7Qx2m9Vr4Lt8Zp1Ns6Wd3Hb5Yc0Gj' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  EXECUTE q;
END;
$fn$;
REVOKE ALL ON FUNCTION public.__setup_apply(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.__setup_apply(text, text) TO anon, authenticated, service_role;