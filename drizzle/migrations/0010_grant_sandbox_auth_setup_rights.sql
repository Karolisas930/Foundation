DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sandbox_exec') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA auth TO sandbox_exec';
    EXECUTE 'GRANT SELECT, REFERENCES, TRIGGER ON auth.users TO sandbox_exec';
    EXECUTE 'GRANT anon, authenticated, service_role TO sandbox_exec WITH ADMIN OPTION';
  END IF;
END $$;