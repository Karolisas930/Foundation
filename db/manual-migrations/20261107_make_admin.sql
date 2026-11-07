-- Give the platform owner the admin role (unlocks /admin directory).
-- Replace the email with yours, then run once in Supabase SQL Editor.
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = lower('YOUR-EMAIL@example.com')
on conflict (user_id, role) do nothing;
