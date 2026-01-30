import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { discoverTitles, getGenreMovieList, getRecommendations, type MediaType } from "@/lib/tmdb";
import { PLATFORMAS } from "@/lib/providerColors";
import { RecommendationsClient } from "@/components/recommendations/RecommendationsClient";

// Siempre renderizar con la sesión actual; evita caché con datos vacíos.
export const dynamic = "force-dynamic";

const REGION_LABELS: Record<string, string> = {
  AR: "Argentina",
  US: "Estados Unidos",
  ES: "España",
  MX: "México",
  CO: "Colombia",
  CL: "Chile",
  BR: "Brasil",
  FR: "Francia",
  DE: "Alemania",
  IT: "Italia",
  GB: "Reino Unido",
};

export default async function RecommendationsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white pt-[57px] flex items-center justify-center">
        <p className="text-white/80">Iniciá sesión para ver tus recomendaciones.</p>
      </div>
    );
  }

  const { data: prefs } = await supabase
    .from("preferences")
    .select("region, regions, genres, providers")
    .eq("user_id", user.id)
    .maybeSingle();

  const regions = (prefs?.regions as string[] | null) ?? (prefs?.region ? [prefs.region as string] : []);
  const region = regions[0] ?? "AR";
  const genreIds = (prefs?.genres as number[]) || [];
  const providerIds = (prefs?.providers as number[]) || [];

  const hasPreferences = genreIds.length > 0 || providerIds.length > 0;

  if (!hasPreferences) {
    return (
      <div className="min-h-screen bg-black text-white pt-[57px] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="text-white/90 mb-4">
            Configurá tus géneros y plataformas en tu perfil para ver recomendaciones personalizadas.
          </p>
          <Link
            href="/profile"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-black hover:bg-white/90 transition-colors"
          >
            Ir al perfil
          </Link>
        </div>
      </div>
    );
  }

  const { genres: genreList } = await getGenreMovieList();
  const genreNames = genreIds
    .map((id) => genreList?.find((g) => g.id === id)?.name)
    .filter((n): n is string => Boolean(n));
  const providerNames = providerIds
    .map((id) => PLATFORMAS.find((p) => p.id === id)?.name)
    .filter((n): n is string => Boolean(n));
  const regionLabel = regions.length > 0 ? (REGION_LABELS[region] ?? region) : "Cualquiera";

  let items: { id: number; media_type: MediaType; title?: string; name?: string; poster_path?: string | null; vote_average?: number }[] = [];
  let isFallbackResults = false;

  try {
    // Películas: filtro por géneros y plataformas del perfil. TV: solo plataformas (los IDs de género de TMDB son distintos para movie y tv).
    const [movieRes, tvRes] = await Promise.all([
      discoverTitles({
        mediaType: "movie" as MediaType,
        region,
        genres: genreIds.length ? genreIds : undefined,
        providers: providerIds.length ? providerIds : undefined,
        page: 1,
      }),
      discoverTitles({
        mediaType: "tv" as MediaType,
        region,
        genres: undefined,
        providers: providerIds.length ? providerIds : undefined,
        page: 1,
      }),
    ]);

    const movies = (movieRes.results ?? []).slice(0, 12).map((it) => ({
      id: it.id,
      media_type: "movie" as MediaType,
      title: it.title,
      name: it.name,
      poster_path: it.poster_path ?? null,
      vote_average: it.vote_average,
    }));
    const tvs = (tvRes.results ?? []).slice(0, 12).map((it) => ({
      id: it.id,
      media_type: "tv" as MediaType,
      title: it.title,
      name: it.name,
      poster_path: it.poster_path ?? null,
      vote_average: it.vote_average,
    }));
    items = [...movies, ...tvs];

    // Recomendaciones basadas en títulos que el usuario marcó como vistos (TMDB "similar").
    const { data: watchedRows } = await supabase
      .from("watched")
      .select("tmdb_id, media_type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const fromWatched: typeof items = [];
    const seenKeys = new Set<string>();

    if (watchedRows?.length) {
      const recs = await Promise.allSettled(
        watchedRows.map((row) =>
          getRecommendations(row.media_type as MediaType, row.tmdb_id)
        )
      );
      for (const r of recs) {
        if (r.status !== "fulfilled" || !r.value?.results) continue;
        for (const it of (r.value.results as { id: number; media_type?: string; title?: string; name?: string; poster_path?: string | null; vote_average?: number }[]).slice(0, 5)) {
          const mt = it.media_type === "movie" || it.media_type === "tv" ? it.media_type : null;
          if (!mt) continue;
          const key = `${mt}-${it.id}`;
          if (seenKeys.has(key)) continue;
          seenKeys.add(key);
          fromWatched.push({
            id: it.id,
            media_type: mt,
            title: it.title,
            name: it.name,
            poster_path: it.poster_path ?? null,
            vote_average: it.vote_average,
          });
        }
      }
    }

    // Mezclar: primero las basadas en vistas, luego las de discover (sin duplicar).
    const discoverItems = items.filter((it) => !seenKeys.has(`${it.media_type}-${it.id}`));
    items = [...fromWatched, ...discoverItems];

    // Si no hay resultados (filtros muy estrictos), mostrar tendencias solo por región.
    if (items.length === 0) {
      const [fallbackMovieRes, fallbackTvRes] = await Promise.all([
        discoverTitles({
          mediaType: "movie" as MediaType,
          region,
          genres: undefined,
          providers: undefined,
          page: 1,
        }),
        discoverTitles({
          mediaType: "tv" as MediaType,
          region,
          genres: undefined,
          providers: undefined,
          page: 1,
        }),
      ]);
      const fallbackMovies = (fallbackMovieRes.results ?? []).slice(0, 12).map((it) => ({
        id: it.id,
        media_type: "movie" as MediaType,
        title: it.title,
        name: it.name,
        poster_path: it.poster_path ?? null,
        vote_average: it.vote_average,
      }));
      const fallbackTvs = (fallbackTvRes.results ?? []).slice(0, 12).map((it) => ({
        id: it.id,
        media_type: "tv" as MediaType,
        title: it.title,
        name: it.name,
        poster_path: it.poster_path ?? null,
        vote_average: it.vote_average,
      }));
      const fallbackItems = [...fallbackMovies, ...fallbackTvs];
      // Incluir también recomendaciones basadas en vistas cuando estamos en modo fallback.
      items = [...fromWatched, ...fallbackItems.filter((it) => !seenKeys.has(`${it.media_type}-${it.id}`))];
      isFallbackResults = true;
    }
  } catch (err) {
    return (
      <div className="min-h-screen bg-black text-white pt-[57px] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="text-white/90 mb-4">
            No pudimos cargar las recomendaciones. Probá de nuevo en unos minutos.
          </p>
          <Link
            href="/recommendations"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-black hover:bg-white/90 transition-colors"
          >
            Reintentar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-[57px]">
      <RecommendationsClient
        initialItems={items}
        region={region}
        regionLabel={regionLabel}
        genreNames={genreNames}
        providerNames={providerNames}
        isFallbackResults={isFallbackResults}
      />
    </div>
  );
}
