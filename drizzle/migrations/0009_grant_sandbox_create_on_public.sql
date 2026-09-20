DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sandbox_exec') THEN
    EXECUTE 'GRANT USAGE, CREATE ON SCHEMA public TO sandbox_exec';
    EXECUTE 'GRANT anon, authenticated, service_role TO sandbox_exec';
  END IF;
END $$;