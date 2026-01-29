import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  discoverTitles,
  getGenreMovieList,
  type MediaType,
} from "@/lib/tmdb";
import { DiscoverClient } from "@/components/discover/DiscoverClient";

export default async function DiscoverPage(props: {
  searchParams: Promise<{ region?: string; genres?: string | string[]; providers?: string | string[] }>;
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

  const regions = (prefs?.regions as string[] | null) ?? (prefs?.region ? [prefs.region as string] : ["AR"]);
  const defaultRegion = regions[0] ?? "AR";
  const defaultGenres = (prefs?.genres as number[]) || [];
  const defaultProviders = (prefs?.providers as number[]) || [];

  const searchParams = await props.searchParams;
  const regionParam = searchParams.region ?? defaultRegion;
  const genresParam = searchParams.genres;
  const providersParam = searchParams.providers;
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

  const [genreRes, page] = await Promise.all([
    getGenreMovieList(),
    discoverTitles({
      mediaType: "movie" as MediaType,
      region: regionParam,
      genres: genreIds.length ? genreIds : undefined,
      providers: providerIds.length ? providerIds : undefined,
      page: 1,
    }),
  ]);

  const rawResults = page.results ?? [];
  const items = rawResults.slice(0, 24).map((it) => ({
    ...it,
    media_type: (it.media_type ?? "movie") as MediaType,
  }));
  const genres = genreRes.genres ?? [];

  return (
    <div className="min-h-screen bg-black text-white pt-[57px]">
      <DiscoverClient
        items={items}
        genres={genres}
        initialRegion={defaultRegion}
        initialGenres={defaultGenres}
        initialProviders={defaultProviders}
      />
    </div>
  );
}
