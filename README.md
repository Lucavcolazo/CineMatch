# CineMatch

Página para ver y recibir recomendaciones de películas y series, con información de en qué plataforma está disponible cada título.

---

![cinematch](https://github.com/user-attachments/assets/1934096a-157a-411c-9703-56a0ff43f849)


## ··· Funcionalidades

### ▸ Descubrir
Explorar catálogo de películas y series con filtros por región, tipo (movie/tv), géneros, proveedores de streaming y rango de años. Usa TMDB y disponibilidad por país.

### ▸ Recomendaciones
Recomendaciones personalizadas basadas en lo que el usuario ya vio (desde su historial en CineMatch).

### ▸ Búsqueda
Búsqueda de títulos por nombre (películas, series, personas) con resultados en tiempo real.

### ▸ Chat con IA
Asistente de chat que ayuda con películas y series (recomendaciones, datos, etc.) usando Vercel AI SDK.

### ▸ Ficha de título
Detalle de película o serie con sinopsis, valoración, géneros y **dónde ver**: proveedores de streaming (compra/alquiler/flat) según la región del usuario.

### ▸ Autenticación
Registro e inicio de sesión con email y contraseña (y opción Google) mediante Supabase Auth.

### ▸ Perfil
| Sección | Descripción |
|---|---|
| Perfil | Nombre, avatar, preferencias y zona horaria |
| Vistos | Lista de películas y series marcadas como vistas |
| Favoritos | Lista de títulos favoritos |
| Estadísticas | Resumen de actividad (vistos, favoritos, etc.) |

---

## ··· Stack

```
Frontend    →  Next.js 16 (App Router) · React 19 · Tailwind CSS 4
Iconos      →  Lucide React
Backend     →  Supabase (Auth · Postgres · RLS)
Datos       →  TMDB API (títulos, géneros, watch providers)
IA          →  Vercel AI SDK
Deploy      →  Vercel
```

---

## ··· Estructura del proyecto

```
CineMatch/
├── app/
│   ├── (auth)/                  # Login, registro, recuperar/restablecer contraseña
│   ├── (app)/
│   │   ├── discover/            # Descubrir con filtros
│   │   ├── recommendations/     # Recomendaciones personalizadas
│   │   ├── search/              # Búsqueda
│   │   ├── chat/                # Chat con IA
│   │   ├── profile/             # Perfil, vistos, favoritos, estadísticas
│   │   └── title/[mediaType]/[id]/  # Ficha de película o serie
│   └── api/
│       ├── search/              # Búsqueda
│       ├── discover/            # Descubrir
│       ├── recommendations/    # Recomendaciones
│       ├── chat/                # Chat con IA
│       └── title/               # Detalle y proveedores por región
├── components/
│   ├── auth/                    # Formularios de autenticación
│   ├── discover/                # Filtros, grid, modal de título
│   ├── recommendations/         # Vista de recomendaciones
│   ├── search/                  # Búsqueda
│   ├── chat/                    # Chat y mensajes
│   ├── profile/                 # Perfil, vistos, favoritos, stats
│   ├── title/                   # Ficha, favoritos, proveedores
│   └── layout/                  # Navbar, footer, dropdown
├── lib/
│   ├── supabase/                # Cliente navegador y servidor
│   ├── tmdb.ts                  # Cliente TMDB y helpers
│   ├── ai/                      # Herramientas y prompts para el chat
│   └── ...                      # Utilidades, cache, tipos
└── supabase/
    └── migrations/              # SQL (perfiles, preferencias, vistos, favoritos, chats)
```

---

## ··· Cómo correrlo localmente

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd CineMatch
npm install
```

### 2. Variables de entorno

Creá un archivo `.env.local` en la raíz con:

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (proyecto en [supabase.com](https://supabase.com))
- `TMDB_ACCESS_TOKEN` (API key de [TMDB](https://www.themoviedb.org/settings/api))

Si usás el chat con IA, agregá las variables que pida el proveedor (por ejemplo Vercel AI / OpenAI).

### 3. Configurar Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. Ejecutar las migraciones en orden desde `supabase/migrations/` (por ejemplo con `supabase db push` o desde el SQL Editor del dashboard).

### 4. Correr en desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).
