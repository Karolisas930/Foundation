DO $$
BEGIN
  EXECUTE 'GRANT REFERENCES ON TABLE auth.users TO sandbox_exec';
END $$;