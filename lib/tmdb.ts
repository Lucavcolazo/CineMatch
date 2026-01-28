import { getRequiredEnv } from "@/lib/env";

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
  // TMDB recomienda API v3 key (query param).
  return getRequiredEnv("TMDB_API_KEY");
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

export async function getRecommendations(
  mediaType: MediaType,
  id: number
): Promise<TmdbPagedResponse<TmdbSearchResult>> {
  return tmdbFetch(`/${mediaType}/${id}/recommendations`);
}

export async function discoverTitles(params: {
  mediaType: MediaType;
  region?: string; // e.g. AR
  genres?: number[]; // TMDB genre ids
  providers?: number[]; // TMDB watch provider ids
  page?: number;
}) {
  const { mediaType, region = "AR", genres = [], providers = [], page = 1 } = params;

  // Importante: el endpoint discover usa distintos nombres según movie/tv.
  const commonParams: Record<string, string> = {
    page: String(page),
    region,
    sort_by: "popularity.desc",
    include_adult: "false",
  };

  if (genres.length) commonParams.with_genres = genres.join(",");
  if (providers.length) {
    commonParams.with_watch_providers = providers.join(",");
    commonParams.watch_region = region;
  }

  return tmdbFetch<TmdbPagedResponse<TmdbSearchResult>>(`/discover/${mediaType}`, commonParams);
}

