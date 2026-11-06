-- =============================================================================
-- CoachBoard · Étape 5 : journal des générations du co-pilote IA.
-- Sert au quota quotidien par coach et au suivi de la consommation.
-- Chaque coach ne voit et n'ajoute que ses propres lignes ; aucune modification
-- ni suppression (le quota ne peut pas être contourné).
-- =============================================================================
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('exercise', 'session')),
  status text not null check (status in ('ok', 'invalid', 'refused', 'error')),
  model text not null check (char_length(model) <= 60),
  attempts smallint not null default 1 check (attempts between 1 and 10),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  created_at timestamptz not null default now()
);
create index ai_generations_user_time_idx on public.ai_generations (user_id, created_at desc);

alter table public.ai_generations enable row level security;
revoke all on public.ai_generations from anon, authenticated;
grant select, insert (kind, status, model, attempts, input_tokens, output_tokens) on public.ai_generations to authenticated;

create policy ai_generations_select on public.ai_generations for select to authenticated
  using (user_id = (select auth.uid()));
create policy ai_generations_insert on public.ai_generations for insert to authenticated
  with check (user_id = (select auth.uid()));
