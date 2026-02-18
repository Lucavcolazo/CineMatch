export type MediaType = "movie" | "tv";

type TmdbPagedResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export type TmdbSearchResult = {
  id: number;
  media_type: MediaType | "person";
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  /** TMDB suele incluirlo en endpoints de búsqueda. */
  genre_ids?: number[];
  release_date?: string;
  first_air_date?: string;
};

export type TmdbTitleDetails = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genres?: { id: number; name: string }[];
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  runtime?: number; // películas, en minutos
  episode_run_time?: number[]; // series, duración por episodio
  number_of_seasons?: number;
  number_of_episodes?: number;
};

export type TmdbProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
};

export type TmdbWatchProvidersResponse = {
  id: number;
  results: Record<
    string,
    {
      link?: string;
      flatrate?: TmdbProvider[];
      rent?: TmdbProvider[];
      buy?: TmdbProvider[];
    }
  >;
};

const TMDB_BASE = "https://api.themoviedb.org/3";

function getTmdbApiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("Falta TMDB_API_KEY en .env");
  return key;
}

async function tmdbFetch<T>(path: string, params?: Record<string, string>) {
  const apiKey = getTmdbApiKey();
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "es-AR");
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    // Cache suave para evitar rate limits durante navegación.
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`TMDB error ${res.status}: ${body}`);
  }

  return (await res.json()) as T;
}

export async function searchMulti(query: string): Promise<TmdbPagedResponse<TmdbSearchResult>> {
  return tmdbFetch("/search/multi", {
    query,
    include_adult: "false",
  });
}

export async function getTitleDetails(mediaType: MediaType, id: number): Promise<TmdbTitleDetails> {
  return tmdbFetch(`/${mediaType}/${id}`);
}

export async function getWatchProviders(
  mediaType: MediaType,
  id: number
): Promise<TmdbWatchProvidersResponse> {
  return tmdbFetch(`/${mediaType}/${id}/watch/providers`);
}

/** Respuesta de TMDB /movie/{id}/videos o /tv/{id}/videos */
type TmdbVideosResponse = {
  id: number;
  results?: { key?: string; site?: string; type?: string; name?: string }[];
};

export async function getTitleVideos(
  mediaType: MediaType,
  id: number
): Promise<TmdbVideosResponse> {
  return tmdbFetch(`/${mediaType}/${id}/videos`);
}

/** Devuelve la key del primer trailer de YouTube en la respuesta de videos, o null. */
export function getFirstTrailerKey(videos: TmdbVideosResponse): string | null {
  const first = videos.results?.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser") && v.key
  );
  return first?.key ?? null;
}

export async function getRecommendations(
  mediaType: MediaType,
  id: number,
  page = 1
): Promise<TmdbPagedResponse<TmdbSearchResult>> {
  return tmdbFetch(`/${mediaType}/${id}/recommendations`, { page: String(page) });
}

export type TmdbGenre = { id: number; name: string };

export async function getGenreMovieList(): Promise<{ genres: TmdbGenre[] }> {
  return tmdbFetch("/genre/movie/list");
}

export async function getGenreTvList(): Promise<{ genres: TmdbGenre[] }> {
  return tmdbFetch("/genre/tv/list");
}

/** Construye fechas de estreno para TMDB: nunca mostrar estrenos más nuevos que hoy. */
export function getReleaseDateParams(yearFrom?: number, yearTo?: number): {
  primaryReleaseDateGte?: string;
  primaryReleaseDateLte?: string;
  firstAirDateGte?: string;
  firstAirDateLte?: string;
} {
  const today = new Date().toISOString().slice(0, 10);
  let lte = today;
  if (yearTo != null && Number.isFinite(yearTo)) {
    const endOfYear = `${yearTo}-12-31`;
    lte = endOfYear < today ? endOfYear : today;
  }
  const gte = yearFrom != null && Number.isFinite(yearFrom) ? `${yearFrom}-01-01` : undefined;
  return {
    primaryReleaseDateGte: gte,
    primaryReleaseDateLte: lte,
    firstAirDateGte: gte,
    firstAirDateLte: lte,
  };
}

/**
 * Devuelve la página de discover a usar según el día (UTC).
 * Rota entre páginas 1-5 para que los resultados iniciales cambien cada día.
 */
export function getDiscoverPageForToday(): number {
  const dayIndex = Math.floor(Date.now() / 86400000);
  return 1 + (dayIndex % 5);
}

export async function discoverTitles(params: {
  mediaType: MediaType;
  region?: string; // e.g. AR
  genres?: number[]; // TMDB genre ids
  providers?: number[]; // TMDB watch provider ids
  page?: number;
  /** Orden TMDB (ej. popularity.desc, release_date.desc, first_air_date.desc). Por defecto popularity.desc. */
  sortBy?: string;
  /** Fecha mínima de estreno (YYYY-MM-DD). Películas: primary_release_date.gte; TV: first_air_date.gte. */
  primaryReleaseDateGte?: string;
  /** Fecha máxima de estreno (YYYY-MM-DD). Películas: primary_release_date.lte; TV: first_air_date.lte. */
  primaryReleaseDateLte?: string;
  /** Para TV: first_air_date.gte (mismo valor que primary si no se pasa). */
  firstAirDateGte?: string;
  /** Para TV: first_air_date.lte. */
  firstAirDateLte?: string;
}) {
  const {
    mediaType,
    region = "AR",
    genres = [],
    providers = [],
    page = 1,
    sortBy,
    primaryReleaseDateGte,
    primaryReleaseDateLte,
    firstAirDateGte,
    firstAirDateLte,
  } = params;

  const commonParams: Record<string, string> = {
    page: String(page),
    region,
    sort_by: sortBy ?? (mediaType === "tv" ? "first_air_date.desc" : "release_date.desc"),
    include_adult: "false",
  };

  if (genres.length) commonParams.with_genres = genres.join(",");
  if (providers.length) {
    commonParams.with_watch_providers = providers.join(",");
    commonParams.watch_region = region;
  }
  if (mediaType === "movie") {
    if (primaryReleaseDateGte) commonParams["primary_release_date.gte"] = primaryReleaseDateGte;
    if (primaryReleaseDateLte) commonParams["primary_release_date.lte"] = primaryReleaseDateLte;
  } else {
    const faGte = firstAirDateGte ?? primaryReleaseDateGte;
    const faLte = firstAirDateLte ?? primaryReleaseDateLte;
    if (faGte) commonParams["first_air_date.gte"] = faGte;
    if (faLte) commonParams["first_air_date.lte"] = faLte;
  }

  return tmdbFetch<TmdbPagedResponse<TmdbSearchResult>>(`/discover/${mediaType}`, commonParams);
}

