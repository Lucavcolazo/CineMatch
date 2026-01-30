import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { discoverTitles, type MediaType } from "@/lib/tmdb";

/**
 * GET /api/recommendations?page=1
 * Devuelve una página de recomendaciones basadas en las preferencias del usuario (movie + tv combinados).
 * Requiere sesión.
 */
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const page = Math.max(1, Number(pageParam) || 1);
  const fallback = searchParams.get("fallback") === "1";

  const { data: prefs } = await supabase
    .from("preferences")
    .select("region, regions, genres, providers")
    .eq("user_id", user.id)
    .maybeSingle();

  const regions = (prefs?.regions as string[] | null) ?? (prefs?.region ? [prefs.region as string] : ["AR"]);
  const region = regions[0] ?? "AR";
  const genreIds = fallback ? [] : ((prefs?.genres as number[]) || []);
  const providerIds = fallback ? [] : ((prefs?.providers as number[]) || []);

  try {
    // fallback=1: solo región. Si no: películas con géneros+plataformas, TV solo plataformas.
    const [movieRes, tvRes] = await Promise.all([
      discoverTitles({
        mediaType: "movie",
        region,
        genres: genreIds.length ? genreIds : undefined,
        providers: providerIds.length ? providerIds : undefined,
        page,
      }),
      discoverTitles({
        mediaType: "tv",
        region,
        genres: undefined,
        providers: providerIds.length ? providerIds : undefined,
        page,
      }),
    ]);

    const movies = (movieRes.results ?? []).slice(0, 12).map((it) => ({
      ...it,
      media_type: "movie" as const,
    }));
    const tvs = (tvRes.results ?? []).slice(0, 12).map((it) => ({
      ...it,
      media_type: "tv" as const,
    }));
    const results = [...movies, ...tvs];
    const total_pages = Math.max(movieRes.total_pages ?? 1, tvRes.total_pages ?? 1);

    return NextResponse.json({
      results,
      page,
      total_pages,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
