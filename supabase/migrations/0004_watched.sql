-- Películas y series que el usuario marcó como vistas. Se usan en perfil y en recomendaciones.
create table if not exists public.watched (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tmdb_id int not null,
  media_type text not null check (media_type in ('movie','tv')),
  unique (user_id, tmdb_id, media_type)
);

create index if not exists watched_user_id_idx on public.watched (user_id);

alter table public.watched enable row level security;

drop policy if exists "watched_select_own" on public.watched;
create policy "watched_select_own"
on public.watched for select
using (auth.uid() = user_id);

drop policy if exists "watched_insert_own" on public.watched;
create policy "watched_insert_own"
on public.watched for insert
with check (auth.uid() = user_id);

drop policy if exists "watched_delete_own" on public.watched;
create policy "watched_delete_own"
on public.watched for delete
using (auth.uid() = user_id);
