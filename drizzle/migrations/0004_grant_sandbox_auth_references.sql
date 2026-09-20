GRANT REFERENCES, SELECT ON auth.users TO sandbox_exec;
GRANT CREATE ON SCHEMA auth TO sandbox_exec;
GRANT TRIGGER ON auth.users TO sandbox_exec;
GRANT EXECUTE ON FUNCTION auth.uid() TO sandbox_exec;