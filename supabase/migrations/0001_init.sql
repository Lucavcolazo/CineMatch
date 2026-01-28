-- Migración inicial CineMatch
-- Comentarios en español por requerimiento del proyecto.

-- Nota: en Supabase, la extensión pgcrypto suele estar habilitada por defecto,
-- pero la activamos por si acaso.
create extension if not exists "pgcrypto";

-- PERFIL (1:1 con auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  display_name text,
  region text not null default 'AR'
);

-- Preferencias del usuario (separado de profiles para permitir historial/edición)
create table if not exists public.preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  region text not null default 'AR',
  genres int[] not null default '{}',
  providers int[] not null default '{}'
);

-- Favoritos
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tmdb_id int not null,
  media_type text not null check (media_type in ('movie','tv')),
  unique (user_id, tmdb_id, media_type)
);

-- Ratings
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tmdb_id int not null,
  media_type text not null check (media_type in ('movie','tv')),
  rating int not null check (rating >= 1 and rating <= 10),
  unique (user_id, tmdb_id, media_type)
);

-- Trigger genérico para updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists preferences_set_updated_at on public.preferences;
create trigger preferences_set_updated_at
before update on public.preferences
for each row execute procedure public.set_updated_at();

drop trigger if exists ratings_set_updated_at on public.ratings;
create trigger ratings_set_updated_at
before update on public.ratings
for each row execute procedure public.set_updated_at();

-- Crea profile y preferences al crear un usuario en auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, region)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''), 'AR')
  on conflict (id) do nothing;

  insert into public.preferences (user_id, region, genres, providers)
  values (new.id, 'AR', '{}', '{}')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.preferences enable row level security;
alter table public.favorites enable row level security;
alter table public.ratings enable row level security;

-- Políticas: cada usuario solo ve/modifica lo suyo
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "preferences_select_own" on public.preferences;
create policy "preferences_select_own"
on public.preferences for select
using (auth.uid() = user_id);

drop policy if exists "preferences_upsert_own" on public.preferences;
create policy "preferences_upsert_own"
on public.preferences for insert
with check (auth.uid() = user_id);

drop policy if exists "preferences_update_own" on public.preferences;
create policy "preferences_update_own"
on public.preferences for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
on public.favorites for select
using (auth.uid() = user_id);

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
on public.favorites for insert
with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
on public.favorites for delete
using (auth.uid() = user_id);

drop policy if exists "ratings_select_own" on public.ratings;
create policy "ratings_select_own"
on public.ratings for select
using (auth.uid() = user_id);

drop policy if exists "ratings_insert_own" on public.ratings;
create policy "ratings_insert_own"
on public.ratings for insert
with check (auth.uid() = user_id);

drop policy if exists "ratings_update_own" on public.ratings;
create policy "ratings_update_own"
on public.ratings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

