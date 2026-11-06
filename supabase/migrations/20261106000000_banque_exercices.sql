-- =============================================================================
-- CoachBoard · Étape 2 : clubs, profils, banque d'exercices, séances.
--
-- Principe : chaque exercice / séance est un document JSON (colonne `content`)
-- validé par Zod côté application. Les colonnes de filtre sont GÉNÉRÉES à partir
-- de ce JSON : elles ne peuvent pas diverger du document.
--
-- Partage : un exercice appartient à un club ; tous les membres le lisent,
-- seuls son auteur et les admins du club le modifient ou le suppriment.
-- `club_id IS NULL` = bibliothèque CoachBoard, lisible par tout utilisateur
-- connecté, alimentée uniquement par le seed (service role).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Fonctions immuables utilisées par les colonnes générées
-- ---------------------------------------------------------------------------
create function public.age_rank(cat text) returns smallint
language sql immutable parallel safe set search_path = ''
as $$ select array_position(array['U7','U9','U11','U13','U15','U18','Seniors'], cat)::smallint $$;

create function public.jsonb_text_array(j jsonb) returns text[]
language sql immutable parallel safe set search_path = ''
as $$ select coalesce(array(select jsonb_array_elements_text(coalesce(j, '[]'::jsonb))), '{}'::text[]) $$;

create function public.jsonb_sum_durations(blocks jsonb) returns integer
language sql immutable parallel safe set search_path = ''
as $$ select coalesce(sum((b ->> 'durationMin')::int), 0)::int from jsonb_array_elements(coalesce(blocks, '[]'::jsonb)) b $$;

create function public.exercise_search_text(c jsonb) returns tsvector
language sql immutable parallel safe set search_path = ''
as $$
  select to_tsvector('pg_catalog.french'::regconfig,
    coalesce(c ->> 'title', '') || ' ' ||
    coalesce(c ->> 'kicker', '') || ' ' ||
    array_to_string(public.jsonb_text_array(c -> 'themes'), ' '))
$$;

create function public.set_updated_at() returns trigger
language plpgsql set search_path = ''
as $$ begin new.updated_at := now(); return new; end $$;

-- ---------------------------------------------------------------------------
-- Profils (1 par utilisateur Supabase, créé automatiquement)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(coalesce(new.email, ''), '@', 1));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Clubs et membres
-- ---------------------------------------------------------------------------
create type public.club_role as enum ('admin', 'coach');

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  created_at timestamptz not null default now()
);

create table public.club_members (
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.club_role not null default 'coach',
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);
create index club_members_user_idx on public.club_members (user_id);

-- Helpers RLS : SECURITY DEFINER pour éviter la récursion des politiques
-- de club_members sur elle-même.
create function public.is_club_member(c uuid) returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.club_members m where m.club_id = c and m.user_id = (select auth.uid())) $$;

create function public.is_club_admin(c uuid) returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.club_members m where m.club_id = c and m.user_id = (select auth.uid()) and m.role = 'admin') $$;

create function public.shares_club_with(other uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.club_members a
    join public.club_members b on b.club_id = a.club_id
    where a.user_id = (select auth.uid()) and b.user_id = other)
$$;

-- Un club garde toujours au moins un admin.
create function public.ensure_club_keeps_admin() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if old.role = 'admin'
     and exists (select 1 from public.clubs where id = old.club_id)  -- faux pendant la suppression du club
     and not exists (
       select 1 from public.club_members
       where club_id = old.club_id and role = 'admin' and user_id <> old.user_id)
     and (tg_op = 'DELETE' or new.role <> 'admin')
  then
    raise exception 'Le club doit conserver au moins un administrateur.' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end $$;

create trigger club_members_keep_admin
  before update or delete on public.club_members
  for each row execute function public.ensure_club_keeps_admin();

-- Création d'un club : le créateur en devient admin (opération atomique).
create function public.create_club(club_name text) returns public.clubs
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  c public.clubs;
begin
  if uid is null then raise exception 'Authentification requise.' using errcode = '42501'; end if;
  insert into public.clubs (name) values (btrim(club_name)) returning * into c;
  insert into public.club_members (club_id, user_id, role) values (c.id, uid, 'admin');
  return c;
end $$;

-- Rejoindre un club avec son code d'invitation (rôle coach).
create function public.join_club(code text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  cid uuid;
begin
  if uid is null then raise exception 'Authentification requise.' using errcode = '42501'; end if;
  select id into cid from public.clubs where invite_code = lower(btrim(code));
  if cid is null then raise exception 'Code d''invitation invalide.' using errcode = 'P0002'; end if;
  insert into public.club_members (club_id, user_id) values (cid, uid) on conflict do nothing;
  return cid;
end $$;

-- ---------------------------------------------------------------------------
-- Exercices
-- ---------------------------------------------------------------------------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs (id) on delete cascade,
  author_id uuid default auth.uid() references auth.users (id) on delete set null,
  content jsonb not null,

  slug         text     generated always as (content ->> 'slug') stored,
  title        text     generated always as (content ->> 'title') stored,
  themes       text[]   generated always as (public.jsonb_text_array(content -> 'themes')) stored,
  age_from     smallint generated always as (public.age_rank(content #>> '{ageRange,from}')) stored,
  age_to       smallint generated always as (public.age_rank(content #>> '{ageRange,to}')) stored,
  difficulty   text     generated always as (content ->> 'difficulty') stored,
  space        text     generated always as (content #>> '{params,space}') stored,
  court        text     generated always as (content #>> '{diagram,court}') stored,
  duration_min integer  generated always as ((content #>> '{params,durationMin,min}')::int) stored,
  duration_max integer  generated always as ((content #>> '{params,durationMin,max}')::int) stored,
  players_min  integer  generated always as ((content #>> '{params,players,min}')::int) stored,
  players_max  integer  generated always as ((content #>> '{params,players,max}')::int) stored,
  search       tsvector generated always as (public.exercise_search_text(content)) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint exercises_content_object check (jsonb_typeof(content) = 'object' and not content ? 'id'),
  constraint exercises_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint exercises_title_present check (char_length(title) between 1 and 80),
  constraint exercises_age_range check (age_from is not null and age_to is not null and age_from <= age_to),
  constraint exercises_difficulty check (difficulty in ('debutant', 'intermediaire', 'avance')),
  constraint exercises_space check (space in ('demi-terrain', 'tout-terrain')),
  constraint exercises_space_court check ((space = 'demi-terrain') = (court = 'half')),
  constraint exercises_duration check (duration_min between 1 and duration_max),
  constraint exercises_players check (players_min between 1 and players_max),
  constraint exercises_slug_unique unique nulls not distinct (club_id, slug)
);

create index exercises_club_updated_idx on public.exercises (club_id, updated_at desc);
create index exercises_themes_idx on public.exercises using gin (themes);
create index exercises_search_idx on public.exercises using gin (search);
create index exercises_author_idx on public.exercises (author_id);

create trigger exercises_updated_at before update on public.exercises
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Séances (UI à l'étape 3 ; table créée dès maintenant)
-- ---------------------------------------------------------------------------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  author_id uuid default auth.uid() references auth.users (id) on delete set null,
  content jsonb not null,

  number       integer generated always as ((content ->> 'number')::int) stored,
  title        text    generated always as (content ->> 'title') stored,
  category     smallint generated always as (public.age_rank(content ->> 'category')) stored,
  duration_min integer generated always as (public.jsonb_sum_durations(content -> 'blocks')) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint sessions_content_object check (jsonb_typeof(content) = 'object' and not content ? 'id'),
  constraint sessions_number check (number >= 1),
  constraint sessions_title_present check (char_length(title) between 1 and 80),
  constraint sessions_category check (category is not null),
  constraint sessions_blocks check (jsonb_typeof(content -> 'blocks') = 'array' and duration_min > 0),
  constraint sessions_number_unique unique (club_id, number)
);

create index sessions_club_updated_idx on public.sessions (club_id, updated_at desc);
-- « Quelles séances utilisent cet exercice ? » : content @> '{"blocks":[{"exerciseId":"…"}]}'
create index sessions_content_idx on public.sessions using gin (content jsonb_path_ops);

create trigger sessions_updated_at before update on public.sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Droits et RLS
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.clubs        enable row level security;
alter table public.club_members enable row level security;
alter table public.exercises    enable row level security;
alter table public.sessions     enable row level security;

revoke all on public.profiles, public.clubs, public.club_members, public.exercises, public.sessions from anon;
revoke all on public.profiles, public.clubs, public.club_members, public.exercises, public.sessions from authenticated;
grant select, update (display_name)        on public.profiles     to authenticated;
grant select, update (name, invite_code), delete on public.clubs  to authenticated;
grant select, update (role), delete        on public.club_members to authenticated;
grant select, insert (club_id, content), update (club_id, content), delete on public.exercises to authenticated;
grant select, insert (club_id, content), update (content), delete          on public.sessions  to authenticated;

revoke execute on function public.create_club(text), public.join_club(text) from public, anon;
grant execute on function public.create_club(text), public.join_club(text) to authenticated;

-- Profils : soi-même et les membres de ses clubs.
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_club_with(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Clubs : lus par leurs membres, gérés par leurs admins (création via create_club).
create policy clubs_select on public.clubs for select to authenticated
  using (public.is_club_member(id));
create policy clubs_update on public.clubs for update to authenticated
  using (public.is_club_admin(id)) with check (public.is_club_admin(id));
create policy clubs_delete on public.clubs for delete to authenticated
  using (public.is_club_admin(id));

-- Membres : visibles dans le club ; rôle changé par un admin ; on peut partir
-- ou être retiré par un admin (adhésion via join_club).
create policy members_select on public.club_members for select to authenticated
  using (public.is_club_member(club_id));
create policy members_update on public.club_members for update to authenticated
  using (public.is_club_admin(club_id)) with check (public.is_club_admin(club_id));
create policy members_delete on public.club_members for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_club_admin(club_id));

-- Exercices.
create policy exercises_select on public.exercises for select to authenticated
  using (club_id is null or public.is_club_member(club_id));
create policy exercises_insert on public.exercises for insert to authenticated
  with check (club_id is not null and public.is_club_member(club_id) and author_id = (select auth.uid()));
create policy exercises_update on public.exercises for update to authenticated
  using (club_id is not null and (author_id = (select auth.uid()) or public.is_club_admin(club_id)))
  with check (club_id is not null and public.is_club_member(club_id));
create policy exercises_delete on public.exercises for delete to authenticated
  using (club_id is not null and (author_id = (select auth.uid()) or public.is_club_admin(club_id)));

-- Séances.
create policy sessions_select on public.sessions for select to authenticated
  using (public.is_club_member(club_id));
create policy sessions_insert on public.sessions for insert to authenticated
  with check (public.is_club_member(club_id) and author_id = (select auth.uid()));
create policy sessions_update on public.sessions for update to authenticated
  using (author_id = (select auth.uid()) or public.is_club_admin(club_id))
  with check (public.is_club_member(club_id));
create policy sessions_delete on public.sessions for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_club_admin(club_id));
