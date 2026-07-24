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

-- Network chat helper: is_verified_contractor now reads profiles.account_type
-- (matches useUser.ts's isContractor: account_type set AND not 'homeowner').
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
grant execute on function public.is_verified_contractor(uuid) to authenticated;