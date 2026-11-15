-- Read-only assertions: division by zero makes a failed invariant fail the query.
SELECT 1 / CASE WHEN bool_and(c.relrowsecurity) AND count(*) = 41 THEN 1 ELSE 0 END AS application_tables_have_rls
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r';

SELECT 1 / CASE WHEN position('email_confirmed_at IS NOT NULL' IN pg_get_functiondef('public.claim_pending_projects()'::regprocedure)) > 0 THEN 1 ELSE 0 END AS claiming_requires_email_confirmation;
SELECT 1 / CASE WHEN position('FOR UPDATE SKIP LOCKED' IN pg_get_functiondef('public.claim_pending_projects()'::regprocedure)) > 0 THEN 1 ELSE 0 END AS claiming_locks_pending_rows;
SELECT 1 / CASE WHEN NOT has_function_privilege('anon', 'public.claim_pending_projects()', 'EXECUTE') THEN 1 ELSE 0 END AS anonymous_claiming_is_forbidden;
SELECT 1 / CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass AND tgname = 'on_auth_user_created' AND tgenabled = 'O') THEN 1 ELSE 0 END AS signup_trigger_is_enabled;
SELECT 1 / CASE WHEN count(*) = 2 AND bool_and(NOT public) AND bool_and(file_size_limit = 10485760) THEN 1 ELSE 0 END AS private_upload_buckets
FROM storage.buckets WHERE id IN ('verifications', 'receipts');