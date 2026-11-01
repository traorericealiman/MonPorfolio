-- La base avait déjà increment_stat(metric text, for_day date) : la version à un
-- seul argument ajoutée par la migration précédente rendait l'appel ambigu.
-- On la retire et on garde (ou crée, sur une base neuve) la version à deux arguments.
-- L'Edge Function appelle increment_stat(metric) : for_day prend sa valeur par défaut.
drop function if exists public.increment_stat(text);

create or replace function public.increment_stat(metric text, for_day date default current_date) returns void
language plpgsql security invoker set search_path = public as $$
begin
  if metric not in ('visits', 'cv_downloads', 'whatsapp_clicks', 'github_clicks', 'linkedin_clicks', 'facebook_clicks') then
    raise exception 'Métrique inconnue : %', metric;
  end if;
  execute format(
    'insert into daily_stats (day, %1$I) values ($1, 1)
     on conflict (day) do update set %1$I = daily_stats.%1$I + 1', metric)
  using for_day;
end;
$$;
revoke execute on function public.increment_stat(text, date) from public, anon, authenticated;
grant execute on function public.increment_stat(text, date) to service_role;
