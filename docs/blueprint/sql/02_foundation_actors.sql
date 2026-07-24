-- =============================================================================
-- Foundation migration #2 — actors (contractors, homeowners, team_members)
-- Target filename when synced: 20260722100100_foundation_actors.sql
-- Idempotent: safe to re-run.
-- Depends on: 01_foundation_profiles_roles.sql (profiles, set_updated_at, app_role)
-- =============================================================================

-- =============================================================================
-- contractors — 1:1 with profiles for contractor-specific fields
-- =============================================================================
create table if not exists public.contractors (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  business_name text,
  legal_form text,           -- 'sole_trader' | 'gmbh' | 'ug' | ...
  trade_license_no text,
  insurance_provider text,
  insurance_policy_no text,
  insurance_expires_on date,
  years_experience integer,
  crew_size integer,
  hourly_rate_min numeric(12,2),
  hourly_rate_max numeric(12,2),
  service_radius_km integer,
  service_postcodes text[] default '{}',
  languages text[] default '{}',
  specialties text[] default '{}',
  website_url text,
  is_available boolean not null default true,
  rating_avg numeric(3,2),
  rating_count integer not null default 0,
  jobs_completed integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.contractors to authenticated, anon;
grant insert, update, delete on public.contractors to authenticated;
grant all on public.contractors to service_role;

alter table public.contractors enable row level security;

drop policy if exists contractors_select_public on public.contractors;
create policy contractors_select_public
  on public.contractors for select
  to authenticated, anon
  using (true);

drop policy if exists contractors_insert_own on public.contractors;
create policy contractors_insert_own
  on public.contractors for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists contractors_update_own on public.contractors;
create policy contractors_update_own
  on public.contractors for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists contractors_delete_own on public.contractors;
create policy contractors_delete_own
  on public.contractors for delete
  to authenticated
  using (auth.uid() = user_id);

drop trigger if exists trg_contractors_updated_at on public.contractors;
create trigger trg_contractors_updated_at
  before update on public.contractors
  for each row execute function public.set_updated_at();

-- =============================================================================
-- homeowners — 1:1 with profiles for homeowner-specific fields
-- =============================================================================
create table if not exists public.homeowners (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  property_type text,        -- 'apartment' | 'house' | 'commercial' | ...
  ownership text,            -- 'owner' | 'tenant' | 'manager'
  address_line1 text,
  address_line2 text,
  postcode text,
  city text,
  region text,
  country text default 'DE',
  preferred_contact text default 'in_app',  -- 'in_app' | 'email' | 'phone'
  budget_band text,          -- 'low' | 'mid' | 'high'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.homeowners to authenticated;
grant all on public.homeowners to service_role;

alter table public.homeowners enable row level security;

drop policy if exists homeowners_select_own on public.homeowners;
create policy homeowners_select_own
  on public.homeowners for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists homeowners_insert_own on public.homeowners;
create policy homeowners_insert_own
  on public.homeowners for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists homeowners_update_own on public.homeowners;
create policy homeowners_update_own
  on public.homeowners for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists homeowners_delete_own on public.homeowners;
create policy homeowners_delete_own
  on public.homeowners for delete
  to authenticated
  using (auth.uid() = user_id);

drop trigger if exists trg_homeowners_updated_at on public.homeowners;
create trigger trg_homeowners_updated_at
  before update on public.homeowners
  for each row execute function public.set_updated_at();

-- =============================================================================
-- team_members — owner-scoped staff roster with granular permission columns
--
-- Mirrors the shape used by:
--   - src/features/contractor/team/team-store.ts
--   - src/features/contractor/team/hooks/useTeamPermissions.ts
--   - src/features/contractor/timesheets/components/useStaffHoursData.ts
-- =============================================================================
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  member_user_id uuid references auth.users(id) on delete set null,
  email text not null,
  name text,
  phone text,
  team_role text not null default 'staff',    -- 'owner' | 'admin' | 'staff' | 'viewer'
  extended_role text,                         -- free-form trade role
  status text not null default 'invited',     -- 'invited' | 'active' | 'suspended'
  hourly_rate numeric(12,2),
  can_see_invoices boolean not null default false,
  can_see_bank_details boolean not null default false,
  can_see_financials boolean not null default false,
  can_log_time boolean not null default true,
  can_upload_receipts boolean not null default false,
  can_upload_photos boolean not null default true,
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, email)
);

-- Backfill columns if a minimal team_members table already exists
alter table public.team_members add column if not exists member_user_id uuid references auth.users(id) on delete set null;
alter table public.team_members add column if not exists name text;
alter table public.team_members add column if not exists phone text;
alter table public.team_members add column if not exists team_role text not null default 'staff';
alter table public.team_members add column if not exists extended_role text;
alter table public.team_members add column if not exists status text not null default 'invited';
alter table public.team_members add column if not exists hourly_rate numeric(12,2);
alter table public.team_members add column if not exists can_see_invoices boolean not null default false;
alter table public.team_members add column if not exists can_see_bank_details boolean not null default false;
alter table public.team_members add column if not exists can_see_financials boolean not null default false;
alter table public.team_members add column if not exists can_log_time boolean not null default true;
alter table public.team_members add column if not exists can_upload_receipts boolean not null default false;
alter table public.team_members add column if not exists can_upload_photos boolean not null default true;
alter table public.team_members add column if not exists invited_at timestamptz not null default now();
alter table public.team_members add column if not exists joined_at timestamptz;
alter table public.team_members add column if not exists created_at timestamptz not null default now();
alter table public.team_members add column if not exists updated_at timestamptz not null default now();

create index if not exists team_members_owner_id_idx on public.team_members(owner_id);
create index if not exists team_members_member_user_id_idx on public.team_members(member_user_id);

grant select, insert, update, delete on public.team_members to authenticated;
grant all on public.team_members to service_role;

alter table public.team_members enable row level security;

-- Owner (contractor) sees and manages their whole roster.
drop policy if exists team_members_select_owner on public.team_members;
create policy team_members_select_owner
  on public.team_members for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists team_members_insert_owner on public.team_members;
create policy team_members_insert_owner
  on public.team_members for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists team_members_update_owner on public.team_members;
create policy team_members_update_owner
  on public.team_members for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists team_members_delete_owner on public.team_members;
create policy team_members_delete_owner
  on public.team_members for delete
  to authenticated
  using (auth.uid() = owner_id);

-- Invited member can read their own row (used by useTeamPermissions).
drop policy if exists team_members_select_self on public.team_members;
create policy team_members_select_self
  on public.team_members for select
  to authenticated
  using (auth.uid() = member_user_id);

drop trigger if exists trg_team_members_updated_at on public.team_members;
create trigger trg_team_members_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();
