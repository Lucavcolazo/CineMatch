-- Regiones múltiples en preferencias y avatar por icono/color en perfil.

-- Preferencias: permitir varias regiones (para discover).
alter table public.preferences
add column if not exists regions text[] not null default '{AR}';

-- Migrar región existente a regions (una sola por usuario ya guardado).
update public.preferences
set regions = array[region]
where region is not null;

-- Perfil: icono y color de burbuja cuando no hay avatar_url.
alter table public.profiles
add column if not exists avatar_icon text;

alter table public.profiles
add column if not exists avatar_color text;
