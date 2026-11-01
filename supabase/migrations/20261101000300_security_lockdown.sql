-- Verrouillage : plus rien ne passe par l'API REST publique de Supabase (clé anon).
-- Seule l'Edge Function "api" (service_role, qui ignore RLS) lit et écrit les données.

-- 1. Supprime toutes les policies RLS héritées de l'ancien setup : certaines pouvaient
--    autoriser la lecture ou l'écriture publique (ex. lecture de admin_users).
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('profile', 'competitions', 'creations', 'projects', 'daily_stats', 'admin_users')
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- 2. Retire tous les droits des rôles publics sur ces tables (en plus de RLS).
revoke all on table profile, competitions, creations, projects, daily_stats, admin_users
  from anon, authenticated;

-- 3. Journal des tentatives de connexion ratées (anti brute force de /admin/login).
create table if not exists login_attempts (
  id bigint generated always as identity primary key,
  ip text not null,
  username text not null,
  at timestamptz not null default now()
);
create index if not exists login_attempts_username_at on login_attempts (username, at);
create index if not exists login_attempts_ip_at on login_attempts (ip, at);
alter table login_attempts enable row level security;
revoke all on table login_attempts from anon, authenticated;

-- 4. Aucune fonction SQL du schéma public n'est appelable depuis l'API publique
--    (increment_stat était appelable par n'importe qui avec la clé anon).
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
