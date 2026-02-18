import {
  discoverTitles,
  getReleaseDateParams,
  getTitleDetails,
  getWatchProviders,
  searchMulti,
  type MediaType,
  type TmdbTitleDetails,
} from "@/lib/tmdb";

export type TitleCandidate = {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: string | null;
  overview: string | null;
  posterPath: string | null;
  voteAverage: number | null;
  genreIds: number[];
};

function getTitleText(d: { title?: string; name?: string }): string {
  return d.title ?? d.name ?? "";
}

function getYearText(d: { release_date?: string; first_air_date?: string }): string | null {
  const raw = (d.release_date ?? d.first_air_date ?? "").slice(0, 4);
  return raw && raw.length === 4 ? raw : null;
}

function looksLikeNaturalLanguageRecommendationQuery(query: string): boolean {
  const q = query.toLowerCase();
  // Si incluye lenguaje de recomendación, rangos temporales o términos de género, suele funcionar mejor con /discover.
  if (
    /\b(recomend|recomenda|recomiéndame|recomendame|suger|que puedo ver|qué puedo ver|para ver|algo parecido)\b/.test(
      q
    )
  ) {
    return true;
  }
  if (/\b(19|20)\d{2}\b/.test(q)) return true;
  if (/\b(recientes?|últim[oa]s?|en adelante|desde)\b/.test(q)) return true;
  if (
    /\b(terror|horror|comedia|drama|thriller|suspenso|romance|acción|aventura|fantasía|ciencia ficción|sci[- ]?fi|misterio|crimen|documental)\b/.test(
      q
    )
  ) {
    return true;
  }
  return false;
}

const MOVIE_GENRE_IDS_ES: Array<{ id: number; keys: RegExp }> = [
  { id: 27, keys: /\b(terror|horror)\b/ },
  { id: 35, keys: /\b(comedia)\b/ },
  { id: 80, keys: /\b(crimen|mafia|mafioso)\b/ },
  { id: 18, keys: /\b(drama)\b/ },
  { id: 53, keys: /\b(thriller|suspenso)\b/ },
  { id: 10749, keys: /\b(romance|romántic[oa]s?)\b/ },
  { id: 28, keys: /\b(acción|accion)\b/ },
  { id: 12, keys: /\b(aventura)\b/ },
  { id: 14, keys: /\b(fantasía|fantasia)\b/ },
  { id: 9648, keys: /\b(misterio)\b/ },
  { id: 878, keys: /\b(ciencia ficción|ciencia ficcion|sci[- ]?fi)\b/ },
  { id: 99, keys: /\b(documental)\b/ },
];

const TV_GENRE_IDS_ES: Array<{ id: number; keys: RegExp }> = [
  { id: 80, keys: /\b(crimen|mafia|mafioso)\b/ },
  { id: 35, keys: /\b(comedia)\b/ },
  { id: 18, keys: /\b(drama)\b/ },
  { id: 10765, keys: /\b(ciencia ficción|ciencia ficcion|sci[- ]?fi|fantasía|fantasia)\b/ },
  { id: 9648, keys: /\b(misterio)\b/ },
  { id: 99, keys: /\b(documental)\b/ },
];

function inferMediaType(query: string): MediaType {
  const q = query.toLowerCase();
  if (/\b(serie|series|temporadas?|episodios?|cap[ií]tulos?)\b/.test(q)) return "tv";
  return "movie";
}

function inferGenreIds(query: string, mediaType: MediaType): number[] {
  const q = query.toLowerCase();
  const map = mediaType === "tv" ? TV_GENRE_IDS_ES : MOVIE_GENRE_IDS_ES;
  const ids = map.filter((g) => g.keys.test(q)).map((g) => g.id);

  // Caso común: "comedia negra" suele caer bien con comedia + crimen.
  if (/\b(comedia negra)\b/.test(q) && mediaType === "movie") {
    const extra = [35, 80].filter((id) => !ids.includes(id));
    ids.push(...extra);
  }

  return ids;
}

function inferYears(query: string): { yearFrom?: number; yearTo?: number } {
  const q = query.toLowerCase();
  const nowYear = new Date().getFullYear();

  const between = q.match(/\bentre\s+(19|20)\d{2}\s+y\s+(19|20)\d{2}\b/);
  if (between) {
    const years = between[0].match(/\b(19|20)\d{2}\b/g)?.map((y) => Number(y)) ?? [];
    if (years.length === 2) return { yearFrom: Math.min(...years), yearTo: Math.max(...years) };
  }

  const from = q.match(/\b(desde|a partir de|en adelante)\s+(19|20)\d{2}\b/);
  if (from) {
    const y = Number(from[0].match(/\b(19|20)\d{2}\b/)?.[0]);
    if (Number.isFinite(y)) return { yearFrom: y };
  }

  const year = q.match(/\b(19|20)\d{2}\b/);
  if (year) {
    const y = Number(year[0]);
    if (Number.isFinite(y)) return { yearFrom: y, yearTo: y };
  }

  if (/\b(recientes?|últim[oa]s?)\b/.test(q)) {
    return { yearFrom: nowYear - 5, yearTo: nowYear };
  }

  return {};
}

async function discoverCandidates(params: {
  query: string;
  limit: number;
  region?: string;
}): Promise<TitleCandidate[]> {
  const { query, limit, region = "AR" } = params;
  const mediaType = inferMediaType(query);
  const genres = inferGenreIds(query, mediaType);
  const { yearFrom, yearTo } = inferYears(query);
  const dates = getReleaseDateParams(yearFrom, yearTo);

  const data = await discoverTitles({
    mediaType,
    region,
    genres,
    sortBy: "popularity.desc",
    primaryReleaseDateGte: dates.primaryReleaseDateGte,
    primaryReleaseDateLte: dates.primaryReleaseDateLte,
    firstAirDateGte: dates.firstAirDateGte,
    firstAirDateLte: dates.firstAirDateLte,
    page: 1,
  });

  const results = (data.results ?? [])
    .map((r) => {
      const title = getTitleText(r);
      return {
        tmdbId: r.id,
        mediaType,
        title,
        year: getYearText(r),
        overview: r.overview ?? null,
        posterPath: r.poster_path ?? null,
        voteAverage: typeof r.vote_average === "number" ? r.vote_average : null,
        genreIds: Array.isArray(r.genre_ids) ? r.genre_ids : [],
      } satisfies TitleCandidate;
    })
    .filter((r) => r.title.trim().length > 0)
    .slice(0, Math.max(1, Math.min(10, limit)));

  return results;
}

export async function searchTitlesByQuery(params: {
  query: string;
  limit?: number;
}): Promise<TitleCandidate[]> {
  const { query, limit = 8 } = params;
  const safeLimit = Math.max(1, Math.min(10, limit));

  if (looksLikeNaturalLanguageRecommendationQuery(query)) {
    const discovered = await discoverCandidates({ query, limit: safeLimit, region: "AR" });
    if (discovered.length) return discovered;
    // Fallback: si /discover no encontró nada, probamos búsqueda multi.
  }

  const data = await searchMulti(query);
  return (data.results ?? [])
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .map((r) => {
      const title = getTitleText(r);
      return {
        tmdbId: r.id,
        mediaType: r.media_type as MediaType,
        title,
        year: getYearText(r),
        overview: r.overview ?? null,
        posterPath: r.poster_path ?? null,
        voteAverage: typeof r.vote_average === "number" ? r.vote_average : null,
        genreIds: Array.isArray(r.genre_ids) ? r.genre_ids : [],
      } satisfies TitleCandidate;
    })
    .filter((r) => r.title.trim().length > 0)
    .slice(0, safeLimit);
}

export type TitleFullInfo = {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: string | null;
  overview: string | null;
  genres: string[];
  voteAverage: number | null;
  runtimeMinutes: number | null;
  episodeRunTimeMinutes: number | null;
  numberOfSeasons: number | null;
  numberOfEpisodes: number | null;
  providersAR: {
    flatrate: string[];
    rent: string[];
    buy: string[];
    link: string | null;
  } | null;
};

function toProvidersList(
  providers: { provider_name: string }[] | undefined
): string[] {
  if (!providers?.length) return [];
  return providers.map((p) => p.provider_name).filter(Boolean);
}

function pickDetailsFields(d: TmdbTitleDetails, mediaType: MediaType): Omit<
  TitleFullInfo,
  "providersAR"
> {
  return {
    tmdbId: d.id,
    mediaType,
    title: getTitleText(d),
    year: getYearText(d),
    overview: d.overview ?? null,
    genres: (d.genres ?? []).map((g) => g.name).filter(Boolean),
    voteAverage: typeof d.vote_average === "number" ? d.vote_average : null,
    runtimeMinutes: mediaType === "movie" && typeof d.runtime === "number" ? d.runtime : null,
    episodeRunTimeMinutes:
      mediaType === "tv" && Array.isArray(d.episode_run_time) && typeof d.episode_run_time[0] === "number"
        ? d.episode_run_time[0]
        : null,
    numberOfSeasons: mediaType === "tv" && typeof d.number_of_seasons === "number" ? d.number_of_seasons : null,
    numberOfEpisodes: mediaType === "tv" && typeof d.number_of_episodes === "number" ? d.number_of_episodes : null,
  };
}

export async function getTitleFullInfo(params: {
  mediaType: MediaType;
  tmdbId: number;
  region?: string;
}): Promise<TitleFullInfo> {
  const { mediaType, tmdbId, region = "AR" } = params;

  const [details, providers] = await Promise.all([
    getTitleDetails(mediaType, tmdbId),
    getWatchProviders(mediaType, tmdbId).catch(() => null),
  ]);

  const base = pickDetailsFields(details, mediaType);

  const ar = providers?.results?.[region];
  const providersAR = ar
    ? {
        flatrate: toProvidersList(ar.flatrate),
        rent: toProvidersList(ar.rent),
        buy: toProvidersList(ar.buy),
        link: typeof ar.link === "string" ? ar.link : null,
      }
    : null;

  return {
    ...base,
    providersAR,
  };
}

