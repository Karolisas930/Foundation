set check_function_bodies = off;

do $$
declare body text; st int;
begin
  select r.status_code, r.content into st, body
  from net._http_response r
  where r.id = (select rid from public.__sql_load where id = 1);
  if st is null or st >= 300 then
    raise exception 'fetch not ready status=%', coalesce(st::text,'null');
  end if;
  execute body;
end $$;

drop table if exists public.__sql_load;