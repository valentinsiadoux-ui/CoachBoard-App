-- =============================================================================
-- CoachBoard · Étape 6 : cycles de progression.
-- Un cycle planifie des séances du club sur plusieurs semaines (document JSON
-- validé par Zod, comme les exercices et les séances). Mêmes droits que les
-- séances : lecture par le club, écriture par l'auteur ou un admin.
-- =============================================================================
create table public.cycles (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  author_id uuid default auth.uid() references auth.users (id) on delete set null,
  content jsonb not null,

  title      text     generated always as (content ->> 'title') stored,
  category   smallint generated always as (public.age_rank(content ->> 'category')) stored,
  start_date text     generated always as (content ->> 'startDate') stored,
  weeks      integer  generated always as (jsonb_array_length(content -> 'weeks')) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint cycles_content_object check (jsonb_typeof(content) = 'object' and not content ? 'id' and jsonb_typeof(content -> 'weeks') = 'array'),
  constraint cycles_title_present check (char_length(title) between 1 and 80),
  constraint cycles_category check (category is not null),
  constraint cycles_start_date check (start_date ~ '^\d{4}-\d{2}-\d{2}$'),
  constraint cycles_weeks check (weeks between 1 and 20)
);

create index cycles_club_start_idx on public.cycles (club_id, start_date desc);
-- « Quels cycles contiennent cette séance ? » : content @> '{"weeks":[{"sessionIds":["…"]}]}'
create index cycles_content_idx on public.cycles using gin (content jsonb_path_ops);

create trigger cycles_updated_at before update on public.cycles
  for each row execute function public.set_updated_at();

alter table public.cycles enable row level security;
revoke all on public.cycles from anon, authenticated;
grant select, insert (club_id, content), update (content), delete on public.cycles to authenticated;

create policy cycles_select on public.cycles for select to authenticated
  using (public.is_club_member(club_id));
create policy cycles_insert on public.cycles for insert to authenticated
  with check (public.is_club_member(club_id) and author_id = (select auth.uid()));
create policy cycles_update on public.cycles for update to authenticated
  using (author_id = (select auth.uid()) or public.is_club_admin(club_id))
  with check (public.is_club_member(club_id));
create policy cycles_delete on public.cycles for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_club_admin(club_id));
