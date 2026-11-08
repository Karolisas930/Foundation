-- Job match alerts: notify contractors whose trades include the job trade
-- and who work in the same city or postal region (first 2 PLZ digits).
create or replace function public.job_matches_contractor(j public.jobs, p public.profiles)
returns boolean language sql stable set search_path = public as $$
  select coalesce(p.account_type, '') not in ('', 'homeowner')
    and not coalesce(p.flagged, false)
    and p.id <> j.owner_id
    and j.trade is not null
    and exists (select 1 from unnest(coalesce(p.trades, '{}'::text[])) t
                where lower(trim(t)) = lower(trim(j.trade)))
    and ((j.city is not null and p.city is not null and lower(trim(j.city)) = lower(trim(p.city)))
      or (j.location_zip is not null and p.postal_code is not null
          and left(trim(j.location_zip), 2) = left(trim(p.postal_code), 2)));
$$;

create or replace function public.notify_job_match()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status not in ('open', 'clarifying') then return new; end if;
  insert into public.notifications (recipient_id, type, title, message, lead_id, payload)
  select p.id, 'new_job', 'New job in ' || coalesce(new.city, new.location_zip, 'your area'),
         new.title, new.id::text,
         jsonb_build_object('job_id', new.id, 'trade', new.trade, 'city', new.city)
  from public.profiles p where public.job_matches_contractor(new, p)
  on conflict (recipient_id, type, lead_id) do nothing;
  return new;
end; $$;

drop trigger if exists jobs_notify_match on public.jobs;
create trigger jobs_notify_match after insert on public.jobs
  for each row execute function public.notify_job_match();

create or replace function public.backfill_my_job_alerts()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if auth.uid() is null then return 0; end if;
  insert into public.notifications (recipient_id, type, title, message, lead_id, payload, created_at)
  select p.id, 'new_job', 'New job in ' || coalesce(j.city, j.location_zip, 'your area'),
         j.title, j.id::text,
         jsonb_build_object('job_id', j.id, 'trade', j.trade, 'city', j.city), j.created_at
  from public.jobs j join public.profiles p on p.id = auth.uid()
  where j.status in ('open', 'clarifying') and public.job_matches_contractor(j, p)
  on conflict (recipient_id, type, lead_id) do nothing;
  get diagnostics n = row_count;
  return n;
end; $$;

revoke all on function public.backfill_my_job_alerts() from public, anon;
grant execute on function public.backfill_my_job_alerts() to authenticated;
revoke all on function public.notify_job_match() from public, anon, authenticated;

insert into public.notifications (recipient_id, type, title, message, lead_id, payload, created_at)
select p.id, 'new_job', 'New job in ' || coalesce(j.city, j.location_zip, 'your area'),
       j.title, j.id::text,
       jsonb_build_object('job_id', j.id, 'trade', j.trade, 'city', j.city), j.created_at
from public.jobs j cross join public.profiles p
where j.status in ('open', 'clarifying') and public.job_matches_contractor(j, p)
on conflict (recipient_id, type, lead_id) do nothing;
