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