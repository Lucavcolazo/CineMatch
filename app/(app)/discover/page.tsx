import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  discoverTitles,
  getDiscoverPageForToday,
  getGenreMovieList,
  getReleaseDateParams,
  type MediaType,
} from "@/lib/tmdb";
import { DiscoverClient } from "@/components/discover/DiscoverClient";

type MediaFilter = "movie" | "tv" | "both";

export default async function DiscoverPage(props: {
  searchParams: Promise<{
    region?: string;
    media?: string;
    genres?: string | string[];
    providers?: string | string[];
    year_from?: string;
    year_to?: string;
  }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const { data: prefs } = user
    ? await supabase
        .from("preferences")
        .select("region, regions, genres, providers")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null as any };

  const defaultGenres = (prefs?.genres as number[]) || [];
  const defaultProviders = (prefs?.providers as number[]) || [];
  // País: por defecto "Cualquiera" (vacío) si no hay selección en la URL.
  const defaultRegion = "";

  const searchParams = await props.searchParams;
  const regionParam = searchParams.region !== undefined ? searchParams.region : defaultRegion;
  const mediaParam = searchParams.media;
  const media: MediaFilter =
    mediaParam === "tv" ? "tv" : mediaParam === "movie" ? "movie" : "both";
  const genresParam = searchParams.genres;
  const providersParam = searchParams.providers;
  const yearFrom = searchParams.year_from ? Number(searchParams.year_from) : undefined;
  const yearTo = searchParams.year_to ? Number(searchParams.year_to) : undefined;
  const {
    primaryReleaseDateGte,
    primaryReleaseDateLte,
    firstAirDateGte,
    firstAirDateLte,
  } = getReleaseDateParams(yearFrom, yearTo);
  const genreIds = Array.isArray(genresParam)
    ? genresParam.map(Number).filter(Number.isFinite)
    : genresParam
      ? [Number(genresParam)].filter(Number.isFinite)
      : defaultGenres;
  const providerIds = Array.isArray(providersParam)
    ? providersParam.map(Number).filter(Number.isFinite)
    : providersParam
      ? [Number(providersParam)].filter(Number.isFinite)
      : defaultProviders;

  const regionForApi = regionParam || "AR";
  const discoverPage = getDiscoverPageForToday();

  if (media === "both") {
    const [genreRes, movieRes, tvRes] = await Promise.all([
      getGenreMovieList(),
      discoverTitles({
        mediaType: "movie" as MediaType,
        region: regionForApi,
        genres: genreIds.length ? genreIds : undefined,
        providers: providerIds.length ? providerIds : undefined,
        page: discoverPage,
        sortBy: "release_date.desc",
        primaryReleaseDateGte,
        primaryReleaseDateLte,
      }),
      discoverTitles({
        mediaType: "tv" as MediaType,
        region: regionForApi,
        genres: genreIds.length ? genreIds : undefined,
        providers: providerIds.length ? providerIds : undefined,
        page: discoverPage,
        sortBy: "first_air_date.desc",
        firstAirDateGte,
        firstAirDateLte,
      }),
    ]);
    const movies = (movieRes.results ?? []).slice(0, 12).map((it) => ({
      ...it,
      media_type: "movie" as MediaType,
    }));
    const tvs = (tvRes.results ?? []).slice(0, 12).map((it) => ({
      ...it,
      media_type: "tv" as MediaType,
    }));
    const items = [...movies, ...tvs];
    const genres = genreRes.genres ?? [];
    return (
      <div className="min-h-screen bg-black text-white pt-[132px] lg:pt-[57px]">
        <DiscoverClient
          items={items}
          genres={genres}
          initialRegion={defaultRegion}
          initialGenres={defaultGenres}
          initialProviders={defaultProviders}
          initialMedia="both"
        />
      </div>
    );
  }

  const mediaType: MediaType = media === "tv" ? "tv" : "movie";
  const [genreRes, firstPage] = await Promise.all([
    getGenreMovieList(),
    discoverTitles({
      mediaType,
      region: regionForApi,
      genres: genreIds.length ? genreIds : undefined,
      providers: providerIds.length ? providerIds : undefined,
      page: discoverPage,
      sortBy: mediaType === "tv" ? "first_air_date.desc" : "release_date.desc",
      primaryReleaseDateGte,
      primaryReleaseDateLte,
      firstAirDateGte,
      firstAirDateLte,
    }),
  ]);

  const rawResults = firstPage.results ?? [];
  const items = rawResults.slice(0, 24).map((it) => ({
    ...it,
    media_type: (it.media_type ?? mediaType) as MediaType,
  }));
  const genres = genreRes.genres ?? [];

  return (
    <div className="min-h-screen bg-black text-white pt-[132px] lg:pt-[57px]">
      <DiscoverClient
        items={items}
        genres={genres}
        initialRegion={defaultRegion}
        initialGenres={defaultGenres}
        initialProviders={defaultProviders}
        initialMedia={media}
      />
    </div>
  );
}
