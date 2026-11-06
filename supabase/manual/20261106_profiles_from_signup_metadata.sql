-- Run once in Supabase SQL Editor.
-- Copies name, company, phone and account type from sign-up into profiles.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, full_name, display_name, company_name, phone, account_type)
  values (
    new.id,
    coalesce(m->>'full_name', m->>'name'),
    coalesce(nullif(m->>'business_name', ''), m->>'full_name', m->>'name'),
    nullif(m->>'business_name', ''),
    nullif(m->>'phone', ''),
    m->>'account_type')
  on conflict (id) do nothing;
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
