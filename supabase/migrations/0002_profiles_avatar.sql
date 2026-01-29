-- Añadir avatar_url al perfil para la imagen del usuario en el navbar.
-- En Supabase Dashboard > Storage crear un bucket "avatars" (público) para que la subida de avatar funcione.
alter table public.profiles
add column if not exists avatar_url text;

-- Permitir insert en profiles para upsert desde la app (p. ej. actualizar perfil).
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);
