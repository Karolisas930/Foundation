create table if not exists public.__fetch_jobs (
  id bigserial primary key,
  request_id bigint not null,
  created_at timestamptz not null default now()
);

create or replace function public.__apply_fetched(_request_id bigint)
returns text
language plpgsql
security definer
set search_path = public, extensions, net
as $fn$
declare body text; st int;
begin
  select status_code, content into st, body from net._http_response where id = _request_id;
  if st is null then return 'no response yet'; end if;
  if st >= 300 then return 'http status ' || st; end if;
  execute body;
  return 'applied ' || length(body) || ' bytes';
end;
$fn$;

revoke execute on function public.__apply_fetched(bigint) from public, anon, authenticated;