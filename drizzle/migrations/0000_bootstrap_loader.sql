create extension if not exists pg_net with schema extensions;

create or replace function public.__load_sql(_url text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  rid bigint;
  body text;
  st int;
  tries int := 0;
begin
  select net.http_get(_url, timeout_milliseconds := 60000) into rid;
  loop
    tries := tries + 1;
    perform pg_sleep(1);
    select status_code, content into st, body from net._http_response where id = rid;
    exit when st is not null or tries > 60;
  end loop;
  if st is null or st >= 300 then
    return 'fetch failed status=' || coalesce(st::text, 'null');
  end if;
  execute body;
  return 'applied ' || length(body) || ' bytes';
end;
$fn$;

revoke execute on function public.__load_sql(text) from public, anon, authenticated;