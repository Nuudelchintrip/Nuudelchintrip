-- One trusted read path for driver and admin trip lists.

create or replace function public.list_my_driver_trips()
returns setof public.trips
language sql
security definer
set search_path = public
stable
as $$
  select t.*
  from public.trips t
  where auth.uid() is not null
    and t.driver_id = auth.uid()
  order by t.departure_at desc;
$$;

revoke all on function public.list_my_driver_trips() from public, anon;
grant execute on function public.list_my_driver_trips() to authenticated;

create or replace function public.admin_list_trips()
returns setof public.trips
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;

  return query
  select t.*
  from public.trips t
  order by t.created_at desc
  limit 200;
end;
$$;

revoke all on function public.admin_list_trips() from public, anon;
grant execute on function public.admin_list_trips() to authenticated;
