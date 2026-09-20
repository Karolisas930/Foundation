create extension if not exists pgcrypto;
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
do $$ begin
  create type public.app_role as enum ('admin','moderator','user','contractor','homeowner');
exception when duplicate_object then null; end $$;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists account_type text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists address_line1 text;
alter table public.profiles add column if not exists address_line2 text;
alter table public.profiles add column if not exists postal_code text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists country text default 'DE';
alter table public.profiles add column if not exists service_radius_km integer;
alter table public.profiles add column if not exists min_project_size integer;
alter table public.profiles add column if not exists trades text[] default '{}'::text[];
alter table public.profiles add column if not exists languages text[] default '{de}'::text[];
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists bank_account_holder text;
alter table public.profiles add column if not exists bank_iban text;
alter table public.profiles add column if not exists bank_bic text;
alter table public.profiles add column if not exists bank_name text;
alter table public.profiles add column if not exists flagged boolean not null default false;
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_manage_own on public.profiles;
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles (id, full_name, display_name, account_type)
  values (new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'account_type')
  on conflict (id) do nothing;
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own on public.user_roles for select to authenticated using (auth.uid()=user_id);
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select to anon, authenticated using (true);
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  trade text,
  base_price_cents integer,
  currency text not null default 'EUR',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists services_provider_idx on public.services(provider_id);
create index if not exists services_trade_idx on public.services(trade);
grant select on public.services to anon, authenticated;
grant insert, update, delete on public.services to authenticated;
grant all on public.services to service_role;
alter table public.services enable row level security;
drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services for select to anon, authenticated using (active=true or auth.uid()=provider_id);
drop policy if exists services_manage_own on public.services;
create policy services_manage_own on public.services for all to authenticated using (auth.uid()=provider_id) with check (auth.uid()=provider_id);
drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at before update on public.services for each row execute function public.set_updated_at();
create table if not exists public.contractors (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  verified boolean not null default false,
  verified_at timestamptz,
  license_number text,
  insurance_provider text,
  insurance_policy_number text,
  insurance_valid_until date,
  years_experience integer,
  team_size integer,
  rating_avg numeric(3,2),
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.contractors to anon, authenticated;
grant insert, update, delete on public.contractors to authenticated;
grant all on public.contractors to service_role;
alter table public.contractors enable row level security;
drop policy if exists contractors_public_read on public.contractors;
create policy contractors_public_read on public.contractors for select to anon, authenticated using (verified=true or auth.uid()=user_id);
drop policy if exists contractors_manage_own on public.contractors;
create policy contractors_manage_own on public.contractors for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop trigger if exists contractors_set_updated_at on public.contractors;
create trigger contractors_set_updated_at before update on public.contractors for each row execute function public.set_updated_at();
create table if not exists public.homeowners (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  property_type text,
  preferred_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.homeowners to authenticated;
grant all on public.homeowners to service_role;
alter table public.homeowners enable row level security;
drop policy if exists homeowners_manage_own on public.homeowners;
create policy homeowners_manage_own on public.homeowners for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop trigger if exists homeowners_set_updated_at on public.homeowners;
create trigger homeowners_set_updated_at before update on public.homeowners for each row execute function public.set_updated_at();
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  member_user_id uuid references auth.users(id) on delete set null,
  email text not null,
  name text,
  phone text,
  team_role text not null default 'staff',
  extended_role text,
  status text not null default 'pending',
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  hourly_rate numeric,
  can_see_invoices boolean not null default false,
  can_see_bank_details boolean not null default false,
  can_see_financials boolean not null default false,
  can_log_time boolean not null default true,
  can_upload_receipts boolean not null default true,
  can_upload_photos boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, email)
);
create index if not exists team_members_owner_idx on public.team_members(owner_id);
create index if not exists team_members_member_idx on public.team_members(member_user_id);
grant select, insert, update, delete on public.team_members to authenticated;
grant all on public.team_members to service_role;
alter table public.team_members enable row level security;
drop policy if exists team_members_select_owner_or_self on public.team_members;
create policy team_members_select_owner_or_self on public.team_members for select to authenticated using (auth.uid()=owner_id or auth.uid()=member_user_id);
drop policy if exists team_members_insert_owner_only on public.team_members;
create policy team_members_insert_owner_only on public.team_members for insert to authenticated with check (auth.uid()=owner_id);
drop policy if exists team_members_update_owner_only on public.team_members;
create policy team_members_update_owner_only on public.team_members for update to authenticated using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
drop policy if exists team_members_delete_owner_only on public.team_members;
create policy team_members_delete_owner_only on public.team_members for delete to authenticated using (auth.uid()=owner_id);
drop trigger if exists team_members_set_updated_at on public.team_members;
create trigger team_members_set_updated_at before update on public.team_members for each row execute function public.set_updated_at();
create or replace function public.is_verified_contractor(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = _user_id and p.account_type is not null and p.account_type <> 'homeowner'
  )
$$;
revoke execute on function public.is_verified_contractor(uuid) from public, anon;
grant execute on function public.is_verified_contractor(uuid) to authenticated;
create table if not exists public.network_threads (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.network_threads to authenticated;
grant all on public.network_threads to service_role;
alter table public.network_threads enable row level security;
create table if not exists public.network_thread_members (
  thread_id uuid not null references public.network_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);
create index if not exists idx_network_thread_members_user on public.network_thread_members(user_id);
grant select, insert, update, delete on public.network_thread_members to authenticated;
grant all on public.network_thread_members to service_role;
alter table public.network_thread_members enable row level security;
create or replace function public.is_network_thread_member(_thread_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.network_thread_members
    where thread_id = _thread_id and user_id = _user_id
  )
$$;
revoke execute on function public.is_network_thread_member(uuid, uuid) from public, anon;
grant execute on function public.is_network_thread_member(uuid, uuid) to authenticated;
drop policy if exists "network_threads_select_members" on public.network_threads;
create policy "network_threads_select_members" on public.network_threads for select to authenticated using (public.is_network_thread_member(id, auth.uid()));
drop policy if exists "network_threads_insert_own" on public.network_threads;
create policy "network_threads_insert_own" on public.network_threads for insert to authenticated with check (auth.uid() = created_by and public.is_verified_contractor(auth.uid()));
drop policy if exists "network_thread_members_select_own" on public.network_thread_members;
create policy "network_thread_members_select_own" on public.network_thread_members for select to authenticated using (user_id = auth.uid() or public.is_network_thread_member(thread_id, auth.uid()));
drop policy if exists "network_thread_members_insert_by_creator" on public.network_thread_members;
create policy "network_thread_members_insert_by_creator" on public.network_thread_members for insert to authenticated with check (exists (select 1 from public.network_threads t where t.id = thread_id and t.created_by = auth.uid()));
drop policy if exists "network_thread_members_delete_self" on public.network_thread_members;
create policy "network_thread_members_delete_self" on public.network_thread_members for delete to authenticated using (user_id = auth.uid());
create table if not exists public.network_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.network_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  channel_type text not null default 'network',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_network_messages_thread on public.network_messages(thread_id, created_at desc);
grant select, insert, update, delete on public.network_messages to authenticated;
grant all on public.network_messages to service_role;
alter table public.network_messages enable row level security;
drop policy if exists "network_messages_select_members" on public.network_messages;
create policy "network_messages_select_members" on public.network_messages for select to authenticated using (public.is_network_thread_member(thread_id, auth.uid()));
drop policy if exists "network_messages_insert_members" on public.network_messages;
create policy "network_messages_insert_members" on public.network_messages for insert to authenticated with check (sender_id = auth.uid() and public.is_network_thread_member(thread_id, auth.uid()));
drop policy if exists "network_messages_update_members" on public.network_messages;
create policy "network_messages_update_members" on public.network_messages for update to authenticated using (public.is_network_thread_member(thread_id, auth.uid())) with check (public.is_network_thread_member(thread_id, auth.uid()));
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  trade text,
  estimated_budget integer,
  location_zip text,
  city text,
  language text default 'de',
  urgency text default 'normal',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jobs_owner_idx on public.jobs(owner_id);
create index if not exists jobs_status_idx on public.jobs(status);
create index if not exists jobs_trade_idx on public.jobs(trade);
grant select, insert, update, delete on public.jobs to authenticated;
grant all on public.jobs to service_role;
alter table public.jobs enable row level security;
drop policy if exists jobs_select_open_or_owner on public.jobs;
create policy jobs_select_open_or_owner on public.jobs for select to authenticated using (status = 'open' or auth.uid() = owner_id);
drop policy if exists jobs_insert_own on public.jobs;
create policy jobs_insert_own on public.jobs for insert to authenticated with check (auth.uid() = owner_id);
drop policy if exists jobs_update_own on public.jobs;
create policy jobs_update_own on public.jobs for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists jobs_delete_own on public.jobs;
create policy jobs_delete_own on public.jobs for delete to authenticated using (auth.uid() = owner_id);
drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at before update on public.jobs for each row execute function public.set_updated_at();
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  contractor_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  match_unlocked boolean not null default false,
  accepted_at timestamptz,
  unlocked_at timestamptz,
  client_accepted_at timestamptz,
  contractor_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, contractor_id)
);
create index if not exists matches_job_idx on public.matches(job_id);
create index if not exists matches_client_idx on public.matches(client_id);
create index if not exists matches_contractor_idx on public.matches(contractor_id);
grant select, insert, update, delete on public.matches to authenticated;
grant all on public.matches to service_role;
alter table public.matches enable row level security;
drop policy if exists matches_select_participants on public.matches;
create policy matches_select_participants on public.matches for select to authenticated using (auth.uid() = client_id or auth.uid() = contractor_id);
drop policy if exists matches_insert_contractor on public.matches;
create policy matches_insert_contractor on public.matches for insert to authenticated with check (auth.uid() = contractor_id);
drop policy if exists matches_update_participants on public.matches;
create policy matches_update_participants on public.matches for update to authenticated using (auth.uid() = client_id or auth.uid() = contractor_id) with check (auth.uid() = client_id or auth.uid() = contractor_id);
drop policy if exists matches_delete_participants on public.matches;
create policy matches_delete_participants on public.matches for delete to authenticated using (auth.uid() = client_id or auth.uid() = contractor_id);
drop trigger if exists matches_set_updated_at on public.matches;
create trigger matches_set_updated_at before update on public.matches for each row execute function public.set_updated_at();
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete set null,
  match_id uuid references public.matches(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  client_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  completed_at timestamptz,
  agreed_price_cents integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bookings_job_idx on public.bookings(job_id);
create index if not exists bookings_match_idx on public.bookings(match_id);
create index if not exists bookings_client_idx on public.bookings(client_id);
create index if not exists bookings_provider_idx on public.bookings(provider_id);
grant select, insert, update, delete on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
drop policy if exists bookings_select_participants on public.bookings;
create policy bookings_select_participants on public.bookings for select to authenticated using (auth.uid() = client_id or auth.uid() = provider_id);
drop policy if exists bookings_insert_participants on public.bookings;
create policy bookings_insert_participants on public.bookings for insert to authenticated with check (auth.uid() = client_id or auth.uid() = provider_id);
drop policy if exists bookings_update_participants on public.bookings;
create policy bookings_update_participants on public.bookings for update to authenticated using (auth.uid() = client_id or auth.uid() = provider_id) with check (auth.uid() = client_id or auth.uid() = provider_id);
drop policy if exists bookings_delete_participants on public.bookings;
create policy bookings_delete_participants on public.bookings for delete to authenticated using (auth.uid() = client_id or auth.uid() = provider_id);
drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at before update on public.bookings for each row execute function public.set_updated_at();
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_booking_idx ON public.messages(booking_id);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_idx ON public.messages(recipient_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messages_select_participants ON public.messages;
CREATE POLICY messages_select_participants ON public.messages FOR SELECT TO authenticated USING (auth.uid()=sender_id OR auth.uid()=recipient_id);
DROP POLICY IF EXISTS messages_insert_sender ON public.messages;
CREATE POLICY messages_insert_sender ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid()=sender_id);
DROP POLICY IF EXISTS messages_update_participants ON public.messages;
CREATE POLICY messages_update_participants ON public.messages FOR UPDATE TO authenticated USING (auth.uid()=sender_id OR auth.uid()=recipient_id) WITH CHECK (auth.uid()=sender_id OR auth.uid()=recipient_id);
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviews_provider_idx ON public.reviews(provider_id);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reviews_public_read ON public.reviews;
CREATE POLICY reviews_public_read ON public.reviews FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS reviews_insert_own ON public.reviews;
CREATE POLICY reviews_insert_own ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid()=client_id);