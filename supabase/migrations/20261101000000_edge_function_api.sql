-- Prépare la base pour l'Edge Function "api" (sans backend Flask).
-- Idempotent : sans risque sur une base qui contient déjà les tables du portfolio.

create table if not exists profile (
  id int2 primary key,
  description text not null default '',
  email text not null default '',
  phone text not null default '',
  photo_url text not null default '',
  github text not null default '',
  linkedin text not null default '',
  facebook text not null default ''
);

create table if not exists competitions (
  id text primary key,
  position int not null default 0,
  created_at timestamptz not null default now(),
  title text not null default '',
  project text not null default '',
  result text not null default '',
  description text not null default '',
  image text not null default ''
);

create table if not exists creations (
  id text primary key,
  position int not null default 0,
  created_at timestamptz not null default now(),
  title text not null default '',
  category text not null default '',
  color text not null default '#0A66C2',
  image text not null default ''
);

create table if not exists projects (
  id text primary key,
  position int not null default 0,
  created_at timestamptz not null default now(),
  title text not null default '',
  description text not null default '',
  tech text[] not null default '{}',
  accent text not null default '#0A66C2',
  bg text not null default '#F5F4F0',
  text_color text not null default '#0A0A0A',
  is_dark boolean not null default false,
  year text not null default '',
  category text not null default '',
  github text not null default '#',
  link text not null default '#',
  image text not null default ''
);

create table if not exists daily_stats (
  day date primary key,
  visits int not null default 0,
  cv_downloads int not null default 0,
  whatsapp_clicks int not null default 0,
  github_clicks int not null default 0,
  linkedin_clicks int not null default 0,
  facebook_clicks int not null default 0
);

create table if not exists admin_users (
  username text primary key,
  password_hash text not null
);

-- Incrémente un compteur du jour (appelée uniquement par l'Edge Function).
drop function if exists increment_stat(text);
create function increment_stat(metric text) returns void
language plpgsql security invoker set search_path = public as $$
begin
  if metric not in ('visits', 'cv_downloads', 'whatsapp_clicks', 'github_clicks', 'linkedin_clicks', 'facebook_clicks') then
    raise exception 'Métrique inconnue : %', metric;
  end if;
  execute format(
    'insert into daily_stats (day, %1$I) values (current_date, 1)
     on conflict (day) do update set %1$I = daily_stats.%1$I + 1', metric);
end;
$$;
revoke execute on function increment_stat(text) from public, anon, authenticated;
grant execute on function increment_stat(text) to service_role;

-- Les tables ne sont plus lues par le navigateur : seule l'Edge Function (service_role,
-- qui ignore RLS) y accède. RLS activé + l'API REST publique ne peut plus lire admin_users.
alter table profile enable row level security;
alter table competitions enable row level security;
alter table creations enable row level security;
alter table projects enable row level security;
alter table daily_stats enable row level security;
alter table admin_users enable row level security;
