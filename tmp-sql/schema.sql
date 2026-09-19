CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  display_name text,
  avatar_url text,
  account_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_manage_own" ON public.profiles;

CREATE POLICY "profiles_manage_own" ON public.profiles
  FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, display_name, account_type)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'account_type'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF to_regclass('public.team_members') IS NOT NULL THEN
    ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS hourly_rate numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.team_members') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS "team_members_select_owner_or_self" ON public.team_members;
    DROP POLICY IF EXISTS "team_members_insert_owner_only" ON public.team_members;
    DROP POLICY IF EXISTS "team_members_update_owner_only" ON public.team_members;
    DROP POLICY IF EXISTS "team_members_delete_owner_only" ON public.team_members;

    EXECUTE $p$CREATE POLICY "team_members_select_owner_or_self"
      ON public.team_members FOR SELECT
      USING (owner_id = auth.uid() OR member_user_id = auth.uid())$p$;

    EXECUTE $p$CREATE POLICY "team_members_insert_owner_only"
      ON public.team_members FOR INSERT
      WITH CHECK (owner_id = auth.uid())$p$;

    EXECUTE $p$CREATE POLICY "team_members_update_owner_only"
      ON public.team_members FOR UPDATE
      USING (owner_id = auth.uid())
      WITH CHECK (owner_id = auth.uid())$p$;

    EXECUTE $p$CREATE POLICY "team_members_delete_owner_only"
      ON public.team_members FOR DELETE
      USING (owner_id = auth.uid())$p$;
  END IF;
END $$;

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

create policy profiles_select_own on public.profiles for select to authenticated using (auth.uid()=id);

drop policy if exists profiles_manage_own on public.profiles;

create policy profiles_manage_own on public.profiles for all to authenticated using (auth.uid()=id) with check (auth.uid()=id);

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

create or replace function public.is_verified_contractor(_user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role in ('contractor','admin'))
$$;

grant execute on function public.is_verified_contractor(uuid) to authenticated;

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
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = _user_id
      and p.account_type is not null
      and p.account_type <> 'homeowner'
  )
$$;

revoke execute on function public.is_verified_contractor(uuid) from public, anon;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type text,
  display_name text,
  full_name text,
  city text,
  avatar_url text,
  trades text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;

CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.is_verified_contractor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
      AND account_type IS NOT NULL
      AND account_type <> 'homeowner'
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_verified_contractor(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_verified_contractor(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.network_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.network_threads TO authenticated;

GRANT ALL ON public.network_threads TO service_role;

ALTER TABLE public.network_threads ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_network_thread_member(_thread_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.network_thread_members
    WHERE thread_id = _thread_id AND user_id = _user_id
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_network_thread_member(uuid, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_network_thread_member(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "network_threads_select_members" ON public.network_threads;

CREATE POLICY "network_threads_select_members" ON public.network_threads
  FOR SELECT TO authenticated
  USING (public.is_network_thread_member(id, auth.uid()));

DROP POLICY IF EXISTS "network_threads_insert_own" ON public.network_threads;

CREATE POLICY "network_threads_insert_own" ON public.network_threads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.is_verified_contractor(auth.uid()));

CREATE TABLE IF NOT EXISTS public.network_thread_members (
  thread_id uuid NOT NULL REFERENCES public.network_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_network_thread_members_user ON public.network_thread_members(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.network_thread_members TO authenticated;

GRANT ALL ON public.network_thread_members TO service_role;

ALTER TABLE public.network_thread_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "network_thread_members_select_own" ON public.network_thread_members;

CREATE POLICY "network_thread_members_select_own" ON public.network_thread_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_network_thread_member(thread_id, auth.uid()));

DROP POLICY IF EXISTS "network_thread_members_insert_by_creator" ON public.network_thread_members;

CREATE POLICY "network_thread_members_insert_by_creator" ON public.network_thread_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.network_threads t
      WHERE t.id = thread_id AND t.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "network_thread_members_delete_self" ON public.network_thread_members;

CREATE POLICY "network_thread_members_delete_self" ON public.network_thread_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.network_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.network_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  channel_type text NOT NULL DEFAULT 'network',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_network_messages_thread ON public.network_messages(thread_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.network_messages TO authenticated;

GRANT ALL ON public.network_messages TO service_role;

ALTER TABLE public.network_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "network_messages_select_members" ON public.network_messages;

CREATE POLICY "network_messages_select_members" ON public.network_messages
  FOR SELECT TO authenticated
  USING (public.is_network_thread_member(thread_id, auth.uid()));

DROP POLICY IF EXISTS "network_messages_insert_members" ON public.network_messages;

CREATE POLICY "network_messages_insert_members" ON public.network_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_network_thread_member(thread_id, auth.uid())
  );

DROP POLICY IF EXISTS "network_messages_update_members" ON public.network_messages;

CREATE POLICY "network_messages_update_members" ON public.network_messages
  FOR UPDATE TO authenticated
  USING (public.is_network_thread_member(thread_id, auth.uid()))
  WITH CHECK (public.is_network_thread_member(thread_id, auth.uid()));

create or replace function public.is_verified_contractor(_user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = _user_id and p.account_type is not null and p.account_type <> 'homeowner'
  )
$$;

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

create policy jobs_select_open_or_owner on public.jobs
  for select to authenticated
  using (status = 'open' or auth.uid() = owner_id);

drop policy if exists jobs_insert_own on public.jobs;

create policy jobs_insert_own on public.jobs
  for insert to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists jobs_update_own on public.jobs;

create policy jobs_update_own on public.jobs
  for update to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists jobs_delete_own on public.jobs;

create policy jobs_delete_own on public.jobs
  for delete to authenticated
  using (auth.uid() = owner_id);

drop trigger if exists jobs_set_updated_at on public.jobs;

create trigger jobs_set_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();

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

create policy matches_select_participants on public.matches
  for select to authenticated
  using (auth.uid() = client_id or auth.uid() = contractor_id);

drop policy if exists matches_insert_contractor on public.matches;

create policy matches_insert_contractor on public.matches
  for insert to authenticated
  with check (auth.uid() = contractor_id);

drop policy if exists matches_update_participants on public.matches;

create policy matches_update_participants on public.matches
  for update to authenticated
  using (auth.uid() = client_id or auth.uid() = contractor_id)
  with check (auth.uid() = client_id or auth.uid() = contractor_id);

drop policy if exists matches_delete_participants on public.matches;

create policy matches_delete_participants on public.matches
  for delete to authenticated
  using (auth.uid() = client_id or auth.uid() = contractor_id);

drop trigger if exists matches_set_updated_at on public.matches;

create trigger matches_set_updated_at before update on public.matches
  for each row execute function public.set_updated_at();

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

create policy bookings_select_participants on public.bookings
  for select to authenticated
  using (auth.uid() = client_id or auth.uid() = provider_id);

drop policy if exists bookings_insert_participants on public.bookings;

create policy bookings_insert_participants on public.bookings
  for insert to authenticated
  with check (auth.uid() = client_id or auth.uid() = provider_id);

drop policy if exists bookings_update_participants on public.bookings;

create policy bookings_update_participants on public.bookings
  for update to authenticated
  using (auth.uid() = client_id or auth.uid() = provider_id)
  with check (auth.uid() = client_id or auth.uid() = provider_id);

drop policy if exists bookings_delete_participants on public.bookings;

create policy bookings_delete_participants on public.bookings
  for delete to authenticated
  using (auth.uid() = client_id or auth.uid() = provider_id);

drop trigger if exists bookings_set_updated_at on public.bookings;

create trigger bookings_set_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, display_name, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name'),
    NEW.raw_user_meta_data ->> 'account_type'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user','contractor','homeowner');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_line1 text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_line2 text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS postal_code text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text DEFAULT 'DE';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS service_radius_km integer;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS min_project_size integer;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trades text[] DEFAULT '{}'::text[];

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{de}'::text[];

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_account_holder text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_iban text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_bic text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_name text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS flagged boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;

GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;

CREATE POLICY user_roles_select_own ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon, authenticated;

GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS categories_public_read ON public.categories;

CREATE POLICY categories_public_read ON public.categories FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  trade text,
  base_price_cents integer,
  currency text NOT NULL DEFAULT 'EUR',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS services_provider_idx ON public.services(provider_id);

CREATE INDEX IF NOT EXISTS services_trade_idx ON public.services(trade);

GRANT SELECT ON public.services TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;

GRANT ALL ON public.services TO service_role;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS services_public_read ON public.services;

CREATE POLICY services_public_read ON public.services FOR SELECT TO anon, authenticated USING (active = true OR auth.uid() = provider_id);

DROP POLICY IF EXISTS services_manage_own ON public.services;

CREATE POLICY services_manage_own ON public.services FOR ALL TO authenticated USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);

DROP TRIGGER IF EXISTS services_set_updated_at ON public.services;

CREATE TRIGGER services_set_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.contractors (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  license_number text,
  insurance_provider text,
  insurance_policy_number text,
  insurance_valid_until date,
  years_experience integer,
  team_size integer,
  rating_avg numeric(3,2),
  rating_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.contractors TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.contractors TO authenticated;

GRANT ALL ON public.contractors TO service_role;

ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contractors_public_read ON public.contractors;

CREATE POLICY contractors_public_read ON public.contractors FOR SELECT TO anon, authenticated USING (verified = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS contractors_manage_own ON public.contractors;

CREATE POLICY contractors_manage_own ON public.contractors FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS contractors_set_updated_at ON public.contractors;

CREATE TRIGGER contractors_set_updated_at BEFORE UPDATE ON public.contractors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.homeowners (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_type text,
  preferred_contact text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.homeowners TO authenticated;

GRANT ALL ON public.homeowners TO service_role;

ALTER TABLE public.homeowners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS homeowners_manage_own ON public.homeowners;

CREATE POLICY homeowners_manage_own ON public.homeowners FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS homeowners_set_updated_at ON public.homeowners;

CREATE TRIGGER homeowners_set_updated_at BEFORE UPDATE ON public.homeowners FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  name text,
  phone text,
  team_role text NOT NULL DEFAULT 'staff',
  extended_role text,
  status text NOT NULL DEFAULT 'pending',
  invited_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz,
  hourly_rate numeric,
  can_see_invoices boolean NOT NULL DEFAULT false,
  can_see_bank_details boolean NOT NULL DEFAULT false,
  can_see_financials boolean NOT NULL DEFAULT false,
  can_log_time boolean NOT NULL DEFAULT true,
  can_upload_receipts boolean NOT NULL DEFAULT true,
  can_upload_photos boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, email)
);

CREATE INDEX IF NOT EXISTS team_members_owner_idx ON public.team_members(owner_id);

CREATE INDEX IF NOT EXISTS team_members_member_idx ON public.team_members(member_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;

GRANT ALL ON public.team_members TO service_role;

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS team_members_select_owner_or_self ON public.team_members;

CREATE POLICY team_members_select_owner_or_self ON public.team_members FOR SELECT TO authenticated USING (auth.uid() = owner_id OR auth.uid() = member_user_id);

DROP POLICY IF EXISTS team_members_insert_owner_only ON public.team_members;

CREATE POLICY team_members_insert_owner_only ON public.team_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS team_members_update_owner_only ON public.team_members;

CREATE POLICY team_members_update_owner_only ON public.team_members FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS team_members_delete_owner_only ON public.team_members;

CREATE POLICY team_members_delete_owner_only ON public.team_members FOR DELETE TO authenticated USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS team_members_set_updated_at ON public.team_members;

CREATE TRIGGER team_members_set_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_verified_contractor(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id AND p.account_type IS NOT NULL AND p.account_type <> 'homeowner'
  )
$$;

CREATE POLICY "network_thread_members_insert_by_creator" ON public.network_thread_members
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.network_threads t WHERE t.id = thread_id AND t.created_by = auth.uid())
  );

CREATE POLICY "network_messages_insert_members" ON public.network_messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.is_network_thread_member(thread_id, auth.uid()));

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  trade text,
  estimated_budget integer,
  location_zip text,
  city text,
  language text DEFAULT 'de',
  urgency text DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jobs_owner_idx ON public.jobs(owner_id);

CREATE INDEX IF NOT EXISTS jobs_status_idx ON public.jobs(status);

CREATE INDEX IF NOT EXISTS jobs_trade_idx ON public.jobs(trade);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;

GRANT ALL ON public.jobs TO service_role;

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jobs_select_open_or_owner ON public.jobs;

CREATE POLICY jobs_select_open_or_owner ON public.jobs FOR SELECT TO authenticated USING (status = 'open' OR auth.uid() = owner_id);

DROP POLICY IF EXISTS jobs_insert_own ON public.jobs;

CREATE POLICY jobs_insert_own ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS jobs_update_own ON public.jobs;

CREATE POLICY jobs_update_own ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS jobs_delete_own ON public.jobs;

CREATE POLICY jobs_delete_own ON public.jobs FOR DELETE TO authenticated USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS jobs_set_updated_at ON public.jobs;

CREATE TRIGGER jobs_set_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  match_unlocked boolean NOT NULL DEFAULT false,
  accepted_at timestamptz,
  unlocked_at timestamptz,
  client_accepted_at timestamptz,
  contractor_accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, contractor_id)
);

CREATE INDEX IF NOT EXISTS matches_job_idx ON public.matches(job_id);

CREATE INDEX IF NOT EXISTS matches_client_idx ON public.matches(client_id);

CREATE INDEX IF NOT EXISTS matches_contractor_idx ON public.matches(contractor_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;

GRANT ALL ON public.matches TO service_role;

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS matches_select_participants ON public.matches;

CREATE POLICY matches_select_participants ON public.matches FOR SELECT TO authenticated USING (auth.uid() = client_id OR auth.uid() = contractor_id);

DROP POLICY IF EXISTS matches_insert_contractor ON public.matches;

CREATE POLICY matches_insert_contractor ON public.matches FOR INSERT TO authenticated WITH CHECK (auth.uid() = contractor_id);

DROP POLICY IF EXISTS matches_update_participants ON public.matches;

CREATE POLICY matches_update_participants ON public.matches FOR UPDATE TO authenticated USING (auth.uid() = client_id OR auth.uid() = contractor_id) WITH CHECK (auth.uid() = client_id OR auth.uid() = contractor_id);

DROP POLICY IF EXISTS matches_delete_participants ON public.matches;

CREATE POLICY matches_delete_participants ON public.matches FOR DELETE TO authenticated USING (auth.uid() = client_id OR auth.uid() = contractor_id);

DROP TRIGGER IF EXISTS matches_set_updated_at ON public.matches;

CREATE TRIGGER matches_set_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  completed_at timestamptz,
  agreed_price_cents integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_job_idx ON public.bookings(job_id);

CREATE INDEX IF NOT EXISTS bookings_match_idx ON public.bookings(match_id);

CREATE INDEX IF NOT EXISTS bookings_client_idx ON public.bookings(client_id);

CREATE INDEX IF NOT EXISTS bookings_provider_idx ON public.bookings(provider_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;

GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bookings_select_participants ON public.bookings;

CREATE POLICY bookings_select_participants ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = client_id OR auth.uid() = provider_id);

DROP POLICY IF EXISTS bookings_insert_participants ON public.bookings;

CREATE POLICY bookings_insert_participants ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id OR auth.uid() = provider_id);

DROP POLICY IF EXISTS bookings_update_participants ON public.bookings;

CREATE POLICY bookings_update_participants ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = client_id OR auth.uid() = provider_id) WITH CHECK (auth.uid() = client_id OR auth.uid() = provider_id);

DROP POLICY IF EXISTS bookings_delete_participants ON public.bookings;

CREATE POLICY bookings_delete_participants ON public.bookings FOR DELETE TO authenticated USING (auth.uid() = client_id OR auth.uid() = provider_id);

DROP TRIGGER IF EXISTS bookings_set_updated_at ON public.bookings;

CREATE TRIGGER bookings_set_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, display_name, account_type)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'account_type')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.is_verified_contractor(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.account_type IS NOT NULL AND p.account_type <> 'homeowner')
$$;

CREATE POLICY jobs_select_open_or_owner ON public.jobs FOR SELECT TO authenticated USING (status='open' OR auth.uid()=owner_id);

CREATE POLICY jobs_insert_own ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid()=owner_id);

CREATE POLICY jobs_update_own ON public.jobs FOR UPDATE TO authenticated USING (auth.uid()=owner_id) WITH CHECK (auth.uid()=owner_id);

CREATE POLICY jobs_delete_own ON public.jobs FOR DELETE TO authenticated USING (auth.uid()=owner_id);

CREATE POLICY matches_select_participants ON public.matches FOR SELECT TO authenticated USING (auth.uid()=client_id OR auth.uid()=contractor_id);

CREATE POLICY matches_insert_contractor ON public.matches FOR INSERT TO authenticated WITH CHECK (auth.uid()=contractor_id);

CREATE POLICY matches_update_participants ON public.matches FOR UPDATE TO authenticated USING (auth.uid()=client_id OR auth.uid()=contractor_id) WITH CHECK (auth.uid()=client_id OR auth.uid()=contractor_id);

CREATE POLICY matches_delete_participants ON public.matches FOR DELETE TO authenticated USING (auth.uid()=client_id OR auth.uid()=contractor_id);

CREATE POLICY bookings_select_participants ON public.bookings FOR SELECT TO authenticated USING (auth.uid()=client_id OR auth.uid()=provider_id);

CREATE POLICY bookings_insert_participants ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid()=client_id OR auth.uid()=provider_id);

CREATE POLICY bookings_update_participants ON public.bookings FOR UPDATE TO authenticated USING (auth.uid()=client_id OR auth.uid()=provider_id) WITH CHECK (auth.uid()=client_id OR auth.uid()=provider_id);

CREATE POLICY bookings_delete_participants ON public.bookings FOR DELETE TO authenticated USING (auth.uid()=client_id OR auth.uid()=provider_id);

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

CREATE OR REPLACE FUNCTION public.is_network_thread_member(_thread_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.network_thread_members WHERE thread_id = _thread_id AND user_id = _user_id)
$$;

CREATE POLICY "network_thread_members_insert_by_creator" ON public.network_thread_members FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.network_threads t WHERE t.id = thread_id AND t.created_by = auth.uid()));

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  lead_id text,
  score integer,
  read boolean NOT NULL DEFAULT false,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recipient_id, type, lead_id)
);

CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
  ON public.notifications(recipient_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select_own ON public.notifications;

CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;

CREATE POLICY notifications_insert_own ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = recipient_id);

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;

CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;

CREATE POLICY notifications_delete_own ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = recipient_id);

ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  vat_id text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  country text DEFAULT 'DE',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clients_owner_idx ON public.clients(owner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;

GRANT ALL ON public.clients TO service_role;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clients_select_own ON public.clients;

CREATE POLICY clients_select_own ON public.clients
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS clients_insert_own ON public.clients;

CREATE POLICY clients_insert_own ON public.clients
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS clients_update_own ON public.clients;

CREATE POLICY clients_update_own ON public.clients
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS clients_delete_own ON public.clients;

CREATE POLICY clients_delete_own ON public.clients
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS clients_set_updated_at ON public.clients;

CREATE TRIGGER clients_set_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  number text,
  status text NOT NULL DEFAULT 'draft', -- draft | sent | paid | overdue | storno
  mode text,                             -- fixed | hourly
  client_name text,
  client_email text,
  client_address text,
  client_vat_id text,
  summary text,
  fixed_amount numeric(14,2) DEFAULT 0,
  hourly_rate numeric(14,2) DEFAULT 0,
  hours numeric(10,2) DEFAULT 0,
  surcharge_night_pct numeric(6,2) DEFAULT 0,
  surcharge_weekend_pct numeric(6,2) DEFAULT 0,
  surcharge_holiday_pct numeric(6,2) DEFAULT 0,
  vat_rate numeric(6,2) DEFAULT 19,
  subtotal numeric(14,2) DEFAULT 0,
  surcharge_total numeric(14,2) DEFAULT 0,
  net_total numeric(14,2) NOT NULL DEFAULT 0,
  vat_amount numeric(14,2) DEFAULT 0,
  gross_total numeric(14,2) NOT NULL DEFAULT 0,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  parent_invoice_number text,
  issued_at timestamptz,
  sent_at timestamptz,
  paid_at timestamptz,
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invoices_owner_created_idx ON public.invoices(owner_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;

GRANT ALL ON public.invoices TO service_role;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invoices_select_own ON public.invoices;

CREATE POLICY invoices_select_own ON public.invoices
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS invoices_insert_own ON public.invoices;

CREATE POLICY invoices_insert_own ON public.invoices
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS invoices_update_own ON public.invoices;

CREATE POLICY invoices_update_own ON public.invoices
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS invoices_delete_own ON public.invoices;

CREATE POLICY invoices_delete_own ON public.invoices
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS invoices_set_updated_at ON public.invoices;

CREATE TRIGGER invoices_set_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_date date NOT NULL,
  vendor text,
  amount_cents integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'material',
  file_path text,
  file_mime text,
  ocr_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS receipts_owner_date_idx ON public.receipts(owner_id, receipt_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.receipts TO authenticated;

GRANT ALL ON public.receipts TO service_role;

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS receipts_select_own ON public.receipts;

CREATE POLICY receipts_select_own ON public.receipts
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS receipts_insert_own ON public.receipts;

CREATE POLICY receipts_insert_own ON public.receipts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS receipts_update_own ON public.receipts;

CREATE POLICY receipts_update_own ON public.receipts
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS receipts_delete_own ON public.receipts;

CREATE POLICY receipts_delete_own ON public.receipts
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS receipts_set_updated_at ON public.receipts;

CREATE TRIGGER receipts_set_updated_at BEFORE UPDATE ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid,       -- optional link to team_members.id (per-staff attribution)
  trip_date date NOT NULL,
  from_location text,
  to_location text,
  km numeric(10,2) NOT NULL DEFAULT 0,
  purpose text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trips_owner_date_idx ON public.trips(owner_id, trip_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;

GRANT ALL ON public.trips TO service_role;

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trips_select_own ON public.trips;

CREATE POLICY trips_select_own ON public.trips
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS trips_insert_own ON public.trips;

CREATE POLICY trips_insert_own ON public.trips
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS trips_update_own ON public.trips;

CREATE POLICY trips_update_own ON public.trips
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS trips_delete_own ON public.trips;

CREATE POLICY trips_delete_own ON public.trips
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.finanz_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reserve_percent numeric(6,2) NOT NULL DEFAULT 30.0,
  km_rate_cents integer NOT NULL DEFAULT 30,
  connected_email text,
  connected_email_provider text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.finanz_settings TO authenticated;

GRANT ALL ON public.finanz_settings TO service_role;

ALTER TABLE public.finanz_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS finanz_settings_select_own ON public.finanz_settings;

CREATE POLICY finanz_settings_select_own ON public.finanz_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS finanz_settings_insert_own ON public.finanz_settings;

CREATE POLICY finanz_settings_insert_own ON public.finanz_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS finanz_settings_update_own ON public.finanz_settings;

CREATE POLICY finanz_settings_update_own ON public.finanz_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS finanz_settings_set_updated_at ON public.finanz_settings;

CREATE TRIGGER finanz_settings_set_updated_at BEFORE UPDATE ON public.finanz_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.staff_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid,          -- team_members.id (nullable to allow ad-hoc entries)
  member_name text,
  work_date date NOT NULL,
  hours numeric(6,2) NOT NULL DEFAULT 0,
  notes text,
  status text DEFAULT 'pending',
  location_lat numeric(10,7),
  location_lng numeric(10,7),
  location_accuracy_m numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_hours_owner_date_idx ON public.staff_hours(owner_id, work_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_hours TO authenticated;

GRANT ALL ON public.staff_hours TO service_role;

ALTER TABLE public.staff_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_hours_select_own ON public.staff_hours;

CREATE POLICY staff_hours_select_own ON public.staff_hours
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS staff_hours_insert_own ON public.staff_hours;

CREATE POLICY staff_hours_insert_own ON public.staff_hours
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS staff_hours_update_own ON public.staff_hours;

CREATE POLICY staff_hours_update_own ON public.staff_hours
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS staff_hours_delete_own ON public.staff_hours;

CREATE POLICY staff_hours_delete_own ON public.staff_hours
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS staff_hours_set_updated_at ON public.staff_hours;

CREATE TRIGGER staff_hours_set_updated_at BEFORE UPDATE ON public.staff_hours
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.staff_document_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  kind text NOT NULL DEFAULT 'photo',
  captured_via text NOT NULL DEFAULT 'upload',
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_doc_logs_owner_member_idx
  ON public.staff_document_logs(owner_id, member_id, uploaded_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_document_logs TO authenticated;

GRANT ALL ON public.staff_document_logs TO service_role;

ALTER TABLE public.staff_document_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_doc_logs_select_own ON public.staff_document_logs;

CREATE POLICY staff_doc_logs_select_own ON public.staff_document_logs
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS staff_doc_logs_insert_own ON public.staff_document_logs;

CREATE POLICY staff_doc_logs_insert_own ON public.staff_document_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS staff_doc_logs_delete_own ON public.staff_document_logs;

CREATE POLICY staff_doc_logs_delete_own ON public.staff_document_logs
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'pending_review',
  file_path text,
  file_name text,
  mime_type text,
  ocr_json jsonb,
  reviewer_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS verifications_user_kind_idx
  ON public.verifications(user_id, kind, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.verifications TO authenticated;

GRANT ALL ON public.verifications TO service_role;

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS verifications_select_own ON public.verifications;

CREATE POLICY verifications_select_own ON public.verifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS verifications_insert_own ON public.verifications;

CREATE POLICY verifications_insert_own ON public.verifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS verifications_update_own ON public.verifications;

CREATE POLICY verifications_update_own ON public.verifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS verifications_delete_own ON public.verifications;

CREATE POLICY verifications_delete_own ON public.verifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS verifications_set_updated_at ON public.verifications;

CREATE TRIGGER verifications_set_updated_at BEFORE UPDATE ON public.verifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  notes text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  event_type text NOT NULL DEFAULT 'job',
  linked_job_id uuid,
  linked_match_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calendar_events_owner_start_idx
  ON public.calendar_events(owner_id, starts_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;

GRANT ALL ON public.calendar_events TO service_role;

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calendar_events_select_own ON public.calendar_events;

CREATE POLICY calendar_events_select_own ON public.calendar_events
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS calendar_events_insert_own ON public.calendar_events;

CREATE POLICY calendar_events_insert_own ON public.calendar_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS calendar_events_update_own ON public.calendar_events;

CREATE POLICY calendar_events_update_own ON public.calendar_events
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS calendar_events_delete_own ON public.calendar_events;

CREATE POLICY calendar_events_delete_own ON public.calendar_events
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.match_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL,
  contractor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  net_amount_cents integer NOT NULL DEFAULT 0,
  platform_fee_bps integer NOT NULL DEFAULT 500,
  promotional_discount_cents integer NOT NULL DEFAULT 0,
  final_due_cents integer NOT NULL DEFAULT 0,
  promo_code text,
  status text NOT NULL DEFAULT 'open',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, contractor_id)
);

CREATE INDEX IF NOT EXISTS match_invoices_contractor_idx
  ON public.match_invoices(contractor_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_invoices TO authenticated;

GRANT ALL ON public.match_invoices TO service_role;

ALTER TABLE public.match_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS match_invoices_select_own ON public.match_invoices;

CREATE POLICY match_invoices_select_own ON public.match_invoices
  FOR SELECT TO authenticated USING (auth.uid() = contractor_id);

DROP POLICY IF EXISTS match_invoices_insert_own ON public.match_invoices;

CREATE POLICY match_invoices_insert_own ON public.match_invoices
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = contractor_id);

DROP POLICY IF EXISTS match_invoices_update_own ON public.match_invoices;

CREATE POLICY match_invoices_update_own ON public.match_invoices
  FOR UPDATE TO authenticated USING (auth.uid() = contractor_id) WITH CHECK (auth.uid() = contractor_id);

CREATE TABLE IF NOT EXISTS public.profile_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_reports_reported_idx
  ON public.profile_reports(reported_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_reports TO authenticated;

GRANT ALL ON public.profile_reports TO service_role;

ALTER TABLE public.profile_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profile_reports_select_own_or_admin ON public.profile_reports;

CREATE POLICY profile_reports_select_own_or_admin ON public.profile_reports
  FOR SELECT TO authenticated USING (
    auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS profile_reports_insert_own ON public.profile_reports;

CREATE POLICY profile_reports_insert_own ON public.profile_reports
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = reporter_id AND reporter_id <> reported_id
  );

DROP POLICY IF EXISTS profile_reports_update_admin ON public.profile_reports;

CREATE POLICY profile_reports_update_admin ON public.profile_reports
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  kind text NOT NULL DEFAULT 'certificate',   -- certificate | inspection_report | handover
  file_path text NOT NULL,                    -- storage: certificate-templates bucket
  file_name text NOT NULL,
  mime_type text NOT NULL,
  merge_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS certificate_templates_owner_idx
  ON public.certificate_templates(owner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificate_templates TO authenticated;

GRANT ALL ON public.certificate_templates TO service_role;

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS certificate_templates_select_own ON public.certificate_templates;

CREATE POLICY certificate_templates_select_own ON public.certificate_templates
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS certificate_templates_insert_own ON public.certificate_templates;

CREATE POLICY certificate_templates_insert_own ON public.certificate_templates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS certificate_templates_update_own ON public.certificate_templates;

CREATE POLICY certificate_templates_update_own ON public.certificate_templates
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS certificate_templates_delete_own ON public.certificate_templates;

CREATE POLICY certificate_templates_delete_own ON public.certificate_templates
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS certificate_templates_set_updated_at ON public.certificate_templates;

CREATE TRIGGER certificate_templates_set_updated_at BEFORE UPDATE ON public.certificate_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.certificate_issuances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.certificate_templates(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  recipient_name text NOT NULL,
  recipient_email text,
  recipient_address text,
  issued_at date NOT NULL DEFAULT CURRENT_DATE,
  merged_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  rendered_path text,                        -- storage path of merged PDF/DOCX
  rendered_mime text,
  sent_via text,                             -- email | download | link
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS certificate_issuances_owner_issued_idx
  ON public.certificate_issuances(owner_id, issued_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificate_issuances TO authenticated;

GRANT ALL ON public.certificate_issuances TO service_role;

ALTER TABLE public.certificate_issuances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS certificate_issuances_select_own ON public.certificate_issuances;

CREATE POLICY certificate_issuances_select_own ON public.certificate_issuances
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS certificate_issuances_insert_own ON public.certificate_issuances;

CREATE POLICY certificate_issuances_insert_own ON public.certificate_issuances
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS certificate_issuances_delete_own ON public.certificate_issuances;

CREATE POLICY certificate_issuances_delete_own ON public.certificate_issuances
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  number text,
  status text NOT NULL DEFAULT 'draft',
  mode text,
  client_name text,
  client_email text,
  client_address text,
  client_vat_id text,
  summary text,
  fixed_amount numeric(14,2) DEFAULT 0,
  hourly_rate numeric(14,2) DEFAULT 0,
  hours numeric(10,2) DEFAULT 0,
  surcharge_night_pct numeric(6,2) DEFAULT 0,
  surcharge_weekend_pct numeric(6,2) DEFAULT 0,
  surcharge_holiday_pct numeric(6,2) DEFAULT 0,
  vat_rate numeric(6,2) DEFAULT 19,
  subtotal numeric(14,2) DEFAULT 0,
  surcharge_total numeric(14,2) DEFAULT 0,
  net_total numeric(14,2) NOT NULL DEFAULT 0,
  vat_amount numeric(14,2) DEFAULT 0,
  gross_total numeric(14,2) NOT NULL DEFAULT 0,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  parent_invoice_number text,
  issued_at timestamptz,
  sent_at timestamptz,
  paid_at timestamptz,
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid,
  trip_date date NOT NULL,
  from_location text,
  to_location text,
  km numeric(10,2) NOT NULL DEFAULT 0,
  purpose text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid,
  member_name text,
  work_date date NOT NULL,
  hours numeric(6,2) NOT NULL DEFAULT 0,
  notes text,
  status text DEFAULT 'pending',
  location_lat numeric(10,7),
  location_lng numeric(10,7),
  location_accuracy_m numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE POLICY profile_reports_select_own_or_admin ON public.profile_reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY profile_reports_insert_own ON public.profile_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id AND reporter_id <> reported_id);

CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  kind text NOT NULL DEFAULT 'certificate',
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  merge_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.certificate_issuances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.certificate_templates(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  recipient_name text NOT NULL,
  recipient_email text,
  recipient_address text,
  issued_at date NOT NULL DEFAULT CURRENT_DATE,
  merged_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  rendered_path text,
  rendered_mime text,
  sent_via text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_level TEXT NOT NULL DEFAULT 'free'
    CHECK (tier_level IN ('free','starter','pro','enterprise')),
  status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('trialing','active','past_due','canceled','expired')),
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;

GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own subscription" ON public.subscriptions;

CREATE POLICY "Users view own subscription" ON public.subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own subscription" ON public.subscriptions;

CREATE POLICY "Users insert own subscription" ON public.subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own subscription" ON public.subscriptions;

CREATE POLICY "Users update own subscription" ON public.subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.staff_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  member_name TEXT,
  work_date DATE NOT NULL,
  hours NUMERIC(6,2) NOT NULL CHECK (hours >= 0),
  notes TEXT,
  job TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_hours_owner ON public.staff_hours(owner_id, work_date DESC);

DROP POLICY IF EXISTS "Owner can manage staff_hours" ON public.staff_hours;

CREATE POLICY "Owner can manage staff_hours"
  ON public.staff_hours FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.staff_gps_pings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  member_name TEXT,
  job TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_gps_owner_time ON public.staff_gps_pings(owner_id, recorded_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_gps_pings TO authenticated;

GRANT ALL ON public.staff_gps_pings TO service_role;

ALTER TABLE public.staff_gps_pings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can manage staff_gps_pings" ON public.staff_gps_pings;

CREATE POLICY "Owner can manage staff_gps_pings"
  ON public.staff_gps_pings FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_staff_hours_updated_at ON public.staff_hours;

CREATE TRIGGER trg_staff_hours_updated_at
  BEFORE UPDATE ON public.staff_hours
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

SELECT 1;

DROP TABLE IF EXISTS public.staff_hours CASCADE;

DROP TABLE IF EXISTS public.staff_gps_pings CASCADE;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

DROP POLICY IF EXISTS "user_roles_read_own" ON public.user_roles;

CREATE POLICY "user_roles_read_own" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

DROP POLICY IF EXISTS clients_manage_own ON public.clients;

CREATE POLICY clients_manage_own ON public.clients FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  number text, status text NOT NULL DEFAULT 'draft', mode text,
  document_type text,
  client_name text, client_email text, client_address text, client_vat_id text,
  summary text,
  fixed_amount numeric(14,2) DEFAULT 0, hourly_rate numeric(14,2) DEFAULT 0, hours numeric(10,2) DEFAULT 0,
  surcharge_night_pct numeric(6,2) DEFAULT 0, surcharge_weekend_pct numeric(6,2) DEFAULT 0, surcharge_holiday_pct numeric(6,2) DEFAULT 0,
  vat_rate numeric(6,2) DEFAULT 19,
  subtotal numeric(14,2) DEFAULT 0, surcharge_total numeric(14,2) DEFAULT 0,
  net_total numeric(14,2) NOT NULL DEFAULT 0, vat_amount numeric(14,2) DEFAULT 0, gross_total numeric(14,2) NOT NULL DEFAULT 0,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  parent_invoice_number text,
  issued_at timestamptz, sent_at timestamptz, paid_at timestamptz, due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

DROP POLICY IF EXISTS invoices_manage_own ON public.invoices;

CREATE POLICY invoices_manage_own ON public.invoices FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS receipts_manage_own ON public.receipts;

CREATE POLICY receipts_manage_own ON public.receipts FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS trips_manage_own ON public.trips;

CREATE POLICY trips_manage_own ON public.trips FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS finanz_settings_manage_own ON public.finanz_settings;

CREATE POLICY finanz_settings_manage_own ON public.finanz_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.staff_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id text NOT NULL,
  member_name text,
  work_date date NOT NULL,
  hours numeric(6,2) NOT NULL DEFAULT 0 CHECK (hours >= 0),
  notes text, job text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  location_lat numeric(10,7), location_lng numeric(10,7), location_accuracy_m numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

DROP POLICY IF EXISTS staff_hours_manage_own ON public.staff_hours;

CREATE POLICY staff_hours_manage_own ON public.staff_hours FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.staff_gps_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id text NOT NULL, member_name text, job text,
  latitude double precision NOT NULL, longitude double precision NOT NULL, accuracy double precision,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_gps_owner_time_idx ON public.staff_gps_pings(owner_id, recorded_at DESC);

DROP POLICY IF EXISTS staff_gps_manage_own ON public.staff_gps_pings;

CREATE POLICY staff_gps_manage_own ON public.staff_gps_pings FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS staff_doc_logs_manage_own ON public.staff_document_logs;

CREATE POLICY staff_doc_logs_manage_own ON public.staff_document_logs FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS verifications_manage_own ON public.verifications;

CREATE POLICY verifications_manage_own ON public.verifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS calendar_events_manage_own ON public.calendar_events;

CREATE POLICY calendar_events_manage_own ON public.calendar_events FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS match_invoices_manage_own ON public.match_invoices;

CREATE POLICY match_invoices_manage_own ON public.match_invoices FOR ALL TO authenticated USING (auth.uid() = contractor_id) WITH CHECK (auth.uid() = contractor_id);

DROP POLICY IF EXISTS certificate_templates_manage_own ON public.certificate_templates;

CREATE POLICY certificate_templates_manage_own ON public.certificate_templates FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS certificate_issuances_manage_own ON public.certificate_issuances;

CREATE POLICY certificate_issuances_manage_own ON public.certificate_issuances FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_level text NOT NULL DEFAULT 'free' CHECK (tier_level IN ('free','starter','pro','enterprise')),
  status text NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing','active','past_due','canceled','expired')),
  trial_ends_at timestamptz, current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON public.subscriptions(user_id);

CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);

DROP POLICY IF EXISTS subscriptions_manage_own ON public.subscriptions;

CREATE POLICY subscriptions_manage_own ON public.subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS subscriptions_set_updated_at ON public.subscriptions;

CREATE TRIGGER subscriptions_set_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS notifications_manage_own ON public.notifications;

CREATE POLICY notifications_manage_own ON public.notifications FOR ALL TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS match_id uuid,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS metadata jsonb;

ALTER TABLE public.notifications
  ALTER COLUMN title DROP NOT NULL;

CREATE INDEX IF NOT EXISTS notifications_match_idx
  ON public.notifications(match_id);

CREATE POLICY notifications_insert_own ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = recipient_id OR auth.uid() = sender_id);

CREATE POLICY notifications_manage_own ON public.notifications
  FOR ALL TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id OR auth.uid() = sender_id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS instagram_handle text;

CREATE OR REPLACE FUNCTION public.get_public_profile(_profile_id uuid)
RETURNS TABLE (
  id uuid,
  business_name text,
  trade text,
  city text,
  bio text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    COALESCE(p.company_name, p.display_name, p.full_name) AS business_name,
    NULLIF(array_to_string(p.trades, ', '), '') AS trade,
    p.city,
    p.bio,
    p.created_at
  FROM public.profiles p
  WHERE p.id = _profile_id
    AND COALESCE(p.account_type, 'handyman') <> 'homeowner'
    AND p.flagged = false;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_public_profiles(_search text DEFAULT NULL, _limit integer DEFAULT 24)
RETURNS TABLE (
  id uuid,
  business_name text,
  trade text,
  city text,
  bio text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    COALESCE(p.company_name, p.display_name, p.full_name) AS business_name,
    NULLIF(array_to_string(p.trades, ', '), '') AS trade,
    p.city,
    p.bio,
    p.created_at
  FROM public.profiles p
  WHERE COALESCE(p.account_type, 'handyman') <> 'homeowner'
    AND p.flagged = false
    AND (
      _search IS NULL OR _search = ''
      OR p.city ILIKE '%' || _search || '%'
      OR COALESCE(p.company_name, p.display_name, p.full_name) ILIKE '%' || _search || '%'
      OR EXISTS (SELECT 1 FROM unnest(p.trades) AS t WHERE t ILIKE '%' || _search || '%')
    )
  ORDER BY p.created_at DESC
  LIMIT LEAST(GREATEST(_limit, 1), 50);
$$;

GRANT EXECUTE ON FUNCTION public.list_public_profiles(text, integer) TO anon, authenticated;

ALTER TABLE public.matches
  ALTER COLUMN job_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.pending_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  title text NOT NULL,
  description text,
  trade text,
  estimated_budget integer,
  location_zip text,
  city text,
  language text,
  urgency text,
  claimed_at timestamptz,
  claimed_job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pending_projects_email_unclaimed_idx
  ON public.pending_projects (email)
  WHERE claimed_at IS NULL;

ALTER TABLE public.pending_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pending_projects_insert_anyone ON public.pending_projects;

CREATE POLICY pending_projects_insert_anyone ON public.pending_projects
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON public.pending_projects TO anon, authenticated;

GRANT ALL ON public.pending_projects TO service_role;

CREATE OR REPLACE FUNCTION public.claim_pending_projects()
RETURNS TABLE (job_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  caller_email text;
  rec record;
  new_job_id uuid;
BEGIN
  IF caller_id IS NULL THEN
    RETURN;
  END IF;

  SELECT email INTO caller_email FROM auth.users WHERE id = caller_id;
  IF caller_email IS NULL THEN
    RETURN;
  END IF;

  FOR rec IN
    SELECT * FROM public.pending_projects
    WHERE email = caller_email AND claimed_at IS NULL
    ORDER BY created_at ASC
  LOOP
    INSERT INTO public.jobs (
      owner_id, title, description, trade, estimated_budget,
      location_zip, city, language, urgency, status
    ) VALUES (
      caller_id, rec.title, rec.description, rec.trade, rec.estimated_budget,
      rec.location_zip, rec.city, rec.language, rec.urgency, 'open'
    )
    RETURNING id INTO new_job_id;

    UPDATE public.pending_projects
      SET claimed_at = now(), claimed_job_id = new_job_id
      WHERE id = rec.id;

    job_id := new_job_id;
    RETURN NEXT;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_pending_projects() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, display_name, account_type, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'account_type',
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label text NOT NULL,
  property_type text NOT NULL DEFAULT 'house',
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  country text NOT NULL DEFAULT 'DE',
  year_built integer,
  size_sqm integer,
  units integer NOT NULL DEFAULT 1,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS properties_owner_idx ON public.properties(owner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;

GRANT ALL ON public.properties TO service_role;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS properties_select_own ON public.properties;

CREATE POLICY properties_select_own ON public.properties
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS properties_insert_own ON public.properties;

CREATE POLICY properties_insert_own ON public.properties
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS properties_update_own ON public.properties;

CREATE POLICY properties_update_own ON public.properties
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS properties_delete_own ON public.properties;

CREATE POLICY properties_delete_own ON public.properties
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS properties_set_updated_at ON public.properties;

CREATE TRIGGER properties_set_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS jobs_property_idx ON public.jobs(property_id);

CREATE TABLE IF NOT EXISTS public.job_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  labor_cents integer NOT NULL DEFAULT 0,
  materials_cents integer NOT NULL DEFAULT 0,
  travel_cents integer NOT NULL DEFAULT 0,
  message text,
  timeline_days integer,
  valid_until date,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'withdrawn')),
  sent_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, contractor_id)
);

CREATE INDEX IF NOT EXISTS job_bids_job_idx ON public.job_bids(job_id);

CREATE INDEX IF NOT EXISTS job_bids_contractor_idx ON public.job_bids(contractor_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_bids TO authenticated;

GRANT ALL ON public.job_bids TO service_role;

ALTER TABLE public.job_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_bids_select_participants ON public.job_bids;

CREATE POLICY job_bids_select_participants ON public.job_bids
  FOR SELECT TO authenticated
  USING (
    auth.uid() = contractor_id
    OR (
      status <> 'draft'
      AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS job_bids_insert_contractor ON public.job_bids;

CREATE POLICY job_bids_insert_contractor ON public.job_bids
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = contractor_id);

DROP POLICY IF EXISTS job_bids_update_contractor ON public.job_bids;

CREATE POLICY job_bids_update_contractor ON public.job_bids
  FOR UPDATE TO authenticated
  USING (auth.uid() = contractor_id)
  WITH CHECK (auth.uid() = contractor_id);

DROP POLICY IF EXISTS job_bids_update_owner ON public.job_bids;

CREATE POLICY job_bids_update_owner ON public.job_bids
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.owner_id = auth.uid()));

DROP POLICY IF EXISTS job_bids_delete_contractor ON public.job_bids;

CREATE POLICY job_bids_delete_contractor ON public.job_bids
  FOR DELETE TO authenticated USING (auth.uid() = contractor_id);

DROP TRIGGER IF EXISTS job_bids_set_updated_at ON public.job_bids;

CREATE TRIGGER job_bids_set_updated_at BEFORE UPDATE ON public.job_bids
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS messages_job_idx ON public.messages(job_id);

CREATE OR REPLACE FUNCTION public.accept_job_bid(_bid_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  bid record;
  job record;
  new_match_id uuid;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO bid FROM public.job_bids WHERE id = _bid_id;
  IF bid IS NULL THEN
    RAISE EXCEPTION 'Bid not found';
  END IF;

  SELECT * INTO job FROM public.jobs WHERE id = bid.job_id;
  IF job IS NULL OR job.owner_id <> caller_id THEN
    RAISE EXCEPTION 'Only the project owner can accept a bid';
  END IF;

  UPDATE public.job_bids
    SET status = 'accepted', decided_at = now()
    WHERE id = bid.id;

  UPDATE public.job_bids
    SET status = 'declined', decided_at = now()
    WHERE job_id = bid.job_id AND id <> bid.id AND status IN ('draft', 'sent');

  UPDATE public.jobs SET status = 'awarded' WHERE id = bid.job_id;

  INSERT INTO public.matches (job_id, client_id, contractor_id, status, accepted_at, client_accepted_at)
  VALUES (bid.job_id, caller_id, bid.contractor_id, 'accepted', now(), now())
  ON CONFLICT (job_id, contractor_id) DO UPDATE
    SET status = 'accepted', accepted_at = now(), client_accepted_at = now()
  RETURNING id INTO new_match_id;

  INSERT INTO public.bookings (job_id, match_id, client_id, provider_id, status, agreed_price_cents, notes)
  VALUES (
    bid.job_id, new_match_id, caller_id, bid.contractor_id, 'confirmed',
    bid.labor_cents + bid.materials_cents + bid.travel_cents, bid.message
  );

  RETURN bid.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_job_bid(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.job_bid_details(_job_id uuid)
RETURNS TABLE (
  id uuid,
  job_id uuid,
  contractor_id uuid,
  labor_cents integer,
  materials_cents integer,
  travel_cents integer,
  message text,
  timeline_days integer,
  valid_until date,
  status text,
  sent_at timestamptz,
  created_at timestamptz,
  contractor_name text,
  contractor_city text,
  contractor_avatar_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = _job_id AND j.owner_id = caller_id) THEN
    RAISE EXCEPTION 'Only the project owner can list bids for this job';
  END IF;

  RETURN QUERY
  SELECT b.id, b.job_id, b.contractor_id, b.labor_cents, b.materials_cents,
         b.travel_cents, b.message, b.timeline_days, b.valid_until, b.status,
         b.sent_at, b.created_at,
         COALESCE(NULLIF(p.company_name, ''), NULLIF(p.display_name, ''),
                  NULLIF(p.full_name, ''), 'Contractor') AS contractor_name,
         p.city AS contractor_city,
         p.avatar_url AS contractor_avatar_url
  FROM public.job_bids b
  LEFT JOIN public.profiles p ON p.id = b.contractor_id
  WHERE b.job_id = _job_id
    AND b.status <> 'draft'
  ORDER BY b.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.job_bid_details(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.my_job_bids()
RETURNS TABLE (
  id uuid,
  job_id uuid,
  labor_cents integer,
  materials_cents integer,
  travel_cents integer,
  message text,
  timeline_days integer,
  valid_until date,
  status text,
  sent_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  job_title text,
  job_city text,
  job_zip text,
  job_trade text,
  job_status text,
  job_budget numeric,
  owner_id uuid,
  owner_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT b.id, b.job_id, b.labor_cents, b.materials_cents, b.travel_cents,
         b.message, b.timeline_days, b.valid_until, b.status, b.sent_at,
         b.created_at, b.updated_at,
         j.title, j.city, j.location_zip, j.trade, j.status,
         j.estimated_budget::numeric,
         j.owner_id,
         COALESCE(NULLIF(p.display_name, ''), NULLIF(p.full_name, ''), 'Client') AS owner_name
  FROM public.job_bids b
  JOIN public.jobs j ON j.id = b.job_id
  LEFT JOIN public.profiles p ON p.id = j.owner_id
  WHERE b.contractor_id = caller_id
  ORDER BY b.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.my_job_bids() TO authenticated;

CREATE OR REPLACE FUNCTION public.my_active_jobs()
RETURNS TABLE (
  booking_id uuid,
  job_id uuid,
  match_id uuid,
  status text,
  agreed_price_cents integer,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz,
  job_title text,
  job_city text,
  job_zip text,
  job_trade text,
  client_id uuid,
  client_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT bk.id, bk.job_id, bk.match_id, bk.status, bk.agreed_price_cents,
         bk.scheduled_start, bk.scheduled_end, bk.completed_at, bk.notes,
         bk.created_at,
         j.title, j.city, j.location_zip, j.trade,
         bk.client_id,
         COALESCE(NULLIF(p.display_name, ''), NULLIF(p.full_name, ''), 'Client') AS client_name
  FROM public.bookings bk
  LEFT JOIN public.jobs j ON j.id = bk.job_id
  LEFT JOIN public.profiles p ON p.id = bk.client_id
  WHERE bk.provider_id = caller_id
  ORDER BY bk.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.my_active_jobs() TO authenticated;

CREATE OR REPLACE FUNCTION public.job_chat_peer(_job_id uuid, _peer_id uuid)
RETURNS TABLE (peer_id uuid, peer_name text, peer_city text, is_owner boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  job record;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO job FROM public.jobs WHERE id = _job_id;
  IF job IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF job.owner_id = caller_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.job_bids b
      WHERE b.job_id = _job_id AND b.contractor_id = _peer_id AND b.status <> 'draft'
    ) THEN
      RAISE EXCEPTION 'That contractor has not bid on this project';
    END IF;
  ELSIF EXISTS (
    SELECT 1 FROM public.job_bids b
    WHERE b.job_id = _job_id AND b.contractor_id = caller_id AND b.status <> 'draft'
  ) THEN
    IF _peer_id <> job.owner_id THEN
      RAISE EXCEPTION 'Contractors can only message the project owner';
    END IF;
  ELSE
    RAISE EXCEPTION 'Not a participant of this project';
  END IF;

  RETURN QUERY
  SELECT p.id,
         COALESCE(NULLIF(p.company_name, ''), NULLIF(p.display_name, ''),
                  NULLIF(p.full_name, ''), 'User') AS peer_name,
         p.city,
         (job.owner_id = _peer_id) AS is_owner
  FROM public.profiles p
  WHERE p.id = _peer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.job_chat_peer(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_job_award(_bid_id uuid, _reason text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  bid record;
  job record;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO bid FROM public.job_bids WHERE id = _bid_id;
  IF bid IS NULL THEN
    RAISE EXCEPTION 'Bid not found';
  END IF;
  IF bid.status <> 'accepted' THEN
    RAISE EXCEPTION 'Only an accepted bid can be cancelled';
  END IF;

  SELECT * INTO job FROM public.jobs WHERE id = bid.job_id;
  IF job IS NULL OR job.owner_id <> caller_id THEN
    RAISE EXCEPTION 'Only the project owner can cancel an award';
  END IF;

  UPDATE public.job_bids
    SET status = 'declined', decided_at = now()
    WHERE id = bid.id;

  UPDATE public.jobs SET status = 'open' WHERE id = bid.job_id;

  UPDATE public.matches
    SET status = 'cancelled'
    WHERE job_id = bid.job_id AND contractor_id = bid.contractor_id;

  UPDATE public.bookings
    SET status = 'cancelled'
    WHERE job_id = bid.job_id AND provider_id = bid.contractor_id;

  BEGIN
    INSERT INTO public.notifications (recipient_id, sender_id, type, message, metadata)
    VALUES (
      bid.contractor_id, caller_id, 'bid_cancelled',
      COALESCE(left(_reason, 240), 'The homeowner cancelled the acceptance of your bid.'),
      jsonb_build_object('job_id', bid.job_id, 'bid_id', bid.id)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN bid.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_job_award(uuid, text) TO authenticated;

CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL UNIQUE REFERENCES public.jobs(id) ON DELETE CASCADE,
  homeowner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contractor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  dates timestamptz[] NOT NULL DEFAULT '{}',
  slot text NOT NULL DEFAULT 'morning' CHECK (slot IN ('morning', 'afternoon', 'evening')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_visits_homeowner_idx ON public.site_visits(homeowner_id);

CREATE INDEX IF NOT EXISTS site_visits_contractor_idx ON public.site_visits(contractor_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_visits TO authenticated;

GRANT ALL ON public.site_visits TO service_role;

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_visits_select_own ON public.site_visits;

CREATE POLICY site_visits_select_own ON public.site_visits
  FOR SELECT TO authenticated
  USING (auth.uid() = homeowner_id OR auth.uid() = contractor_id);

DROP POLICY IF EXISTS site_visits_insert_own ON public.site_visits;

CREATE POLICY site_visits_insert_own ON public.site_visits
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = homeowner_id);

DROP POLICY IF EXISTS site_visits_update_own ON public.site_visits;

CREATE POLICY site_visits_update_own ON public.site_visits
  FOR UPDATE TO authenticated
  USING (auth.uid() = homeowner_id) WITH CHECK (auth.uid() = homeowner_id);

DROP POLICY IF EXISTS site_visits_delete_own ON public.site_visits;

CREATE POLICY site_visits_delete_own ON public.site_visits
  FOR DELETE TO authenticated USING (auth.uid() = homeowner_id);

DROP TRIGGER IF EXISTS site_visits_set_updated_at ON public.site_visits;

CREATE TRIGGER site_visits_set_updated_at BEFORE UPDATE ON public.site_visits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();