## CineMatch

Página para buscar películas/series, recibir recomendaciones y ver en qué plataforma están disponibles (por región).  
Stack: **Next.js (App Router)** + **Supabase (Postgres + Auth)** + **TMDB**.

## Requisitos

- Node.js 18+ (recomendado 20+)
- Cuenta/proyecto en Supabase
- API key de TMDB (API v3)

## Variables de entorno

Copiá `.env.example` a `.env.local` y completá:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `TMDB_API_KEY`

Opcional (solo server-side, no exponer):

- `SUPABASE_SERVICE_ROLE_KEY`

## Base de datos (Supabase)

En tu proyecto de Supabase, ejecutá la migración:

- `supabase/migrations/0001_init.sql`

Esto crea:

- `profiles` (1:1 con `auth.users`)
- `preferences` (region/genres/providers)
- `favorites` (por usuario, tmdb_id, media_type)
- `ratings` (por usuario, tmdb_id, media_type, rating)

Y habilita **RLS** con políticas para que cada usuario acceda solo a sus datos.

## Correr en local

Instalar dependencias:

```bash
npm install
```

Correr el dev server:

```bash
npm run dev
```

Abrí `http://localhost:3000`.

## Rutas principales (v1)

- `/` landing
- `/login` / `/signup`
- `/discover` recomendaciones rápidas (usa `preferences`)
- `/search` búsqueda en TMDB
- `/title/[mediaType]/[id]` detalle + plataformas + favoritos/ratings
- `/profile` preferencias + sesión
- `/profile/favorites` lista simple de favoritos

## Notas

- La disponibilidad por plataforma se obtiene desde TMDB (watch providers) y depende de la región guardada en `preferences.region` (por defecto `AR`).
- No se usan iconos en la UI (por requerimiento).

