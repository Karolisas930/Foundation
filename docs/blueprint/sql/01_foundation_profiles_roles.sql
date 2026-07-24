-- =============================================================================
-- Foundation migration #1 — profiles, roles, categories, services
-- Target filename when synced: 20260722100000_foundation_profiles_roles.sql
-- Idempotent: safe to re-run.
-- =============================================================================

-- Extensions ------------------------------------------------------------------
create extension if not exists pgcrypto;

-- Enums -----------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'moderator', 'contractor', 'homeowner');
  end if;
end $$;

-- Shared helper: updated_at trigger ------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- =============================================================================
-- profiles
-- Extends auth.users(id). Mirror of user fields + matching prefs + bank details.
-- =============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account_type text,
  full_name text,
  display_name text,
  email text,
  phone text,
  avatar_url text,
  bio text,
  address_line1 text,
  address_line2 text,
  postcode text,
  city text,
  region text,
  country text default 'DE',
  language text default 'de',
  trade_categories text[] default '{}',
  service_radius_km integer,
  iban text,
  bic text,
  bank_account_holder text,
  tax_id text,
  vat_id text,
  is_verified boolean not null default false,
  is_onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backfill columns on an already-existing minimal profiles table
alter table public.profiles add column if not exists account_type text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists address_line1 text;
alter table public.profiles add column if not exists address_line2 text;
alter table public.profiles add column if not exists postcode text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists region text;
alter table public.profiles add column if not exists country text default 'DE';
alter table public.profiles add column if not exists language text default 'de';
alter table public.profiles add column if not exists trade_categories text[] default '{}';
alter table public.profiles add column if not exists service_radius_km integer;
alter table public.profiles add column if not exists iban text;
alter table public.profiles add column if not exists bic text;
alter table public.profiles add column if not exists bank_account_holder text;
alter table public.profiles add column if not exists tax_id text;
alter table public.profiles add column if not exists vat_id text;
alter table public.profiles add column if not exists is_verified boolean not null default false;
alter table public.profiles add column if not exists is_onboarded boolean not null default false;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- handle_new_user: auto-create profile row on auth.users insert --------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, account_type)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'account_type', 'homeowner')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- user_roles + has_role()
-- Roles live in a separate table (never on profiles).
-- =============================================================================
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
create policy user_roles_select_own
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

grant execute on function public.has_role(uuid, public.app_role) to authenticated, anon;

-- is_verified_contractor(uid) -------------------------------------------------
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
      and p.is_verified = true
      and public.has_role(_user_id, 'contractor'::public.app_role)
  );
$$;

grant execute on function public.is_verified_contractor(uuid) to authenticated, anon;

-- =============================================================================
-- categories (trade taxonomy)
-- =============================================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  slug text not null unique,
  name text not null,
  name_de text,
  description text,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.categories to authenticated, anon;
grant all on public.categories to service_role;

alter table public.categories enable row level security;

drop policy if exists categories_select_active on public.categories;
create policy categories_select_active
  on public.categories for select
  to authenticated, anon
  using (is_active = true);

drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write
  on public.categories for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- =============================================================================
-- services (provider-owned catalog rows)
-- =============================================================================
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  description text,
  price_amount numeric(12,2),
  price_unit text, -- 'hour' | 'fixed' | 'per_m2' | ...
  currency text not null default 'EUR',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_provider_id_idx on public.services(provider_id);
create index if not exists services_category_id_idx on public.services(category_id);

grant select on public.services to authenticated, anon;
grant insert, update, delete on public.services to authenticated;
grant all on public.services to service_role;

alter table public.services enable row level security;

drop policy if exists services_select_active on public.services;
create policy services_select_active
  on public.services for select
  to authenticated, anon
  using (is_active = true or auth.uid() = provider_id);

drop policy if exists services_insert_own on public.services;
create policy services_insert_own
  on public.services for insert
  to authenticated
  with check (auth.uid() = provider_id);

drop policy if exists services_update_own on public.services;
create policy services_update_own
  on public.services for update
  to authenticated
  using (auth.uid() = provider_id)
  with check (auth.uid() = provider_id);

drop policy if exists services_delete_own on public.services;
create policy services_delete_own
  on public.services for delete
  to authenticated
  using (auth.uid() = provider_id);

drop trigger if exists trg_services_updated_at on public.services;
create trigger trg_services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();
