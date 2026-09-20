GRANT ALL ON SCHEMA public TO sandbox_exec;
GRANT USAGE ON SCHEMA auth TO sandbox_exec;
GRANT SELECT, REFERENCES, TRIGGER ON auth.users TO sandbox_exec;
GRANT CREATE ON SCHEMA auth TO sandbox_exec;
GRANT EXECUTE ON FUNCTION auth.uid() TO sandbox_exec;
GRANT anon, authenticated, service_role TO sandbox_exec;