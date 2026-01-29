import { NextResponse } from "next/server";
import { discoverTitles, type MediaType } from "@/lib/tmdb";

/**
 * GET /api/discover?page=1&region=AR&genres=28,12&providers=8,337
 * Devuelve una página de resultados de discover para películas.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const region = searchParams.get("region") ?? "AR";
  const genresParam = searchParams.get("genres");
  const providersParam = searchParams.get("providers");

  const page = Math.max(1, Number(pageParam) || 1);
  const genreIds = genresParam
    ? genresParam.split(",").map(Number).filter(Number.isFinite)
    : [];
  const providerIds = providersParam
    ? providersParam.split(",").map(Number).filter(Number.isFinite)
    : [];

  try {
    const data = await discoverTitles({
      mediaType: "movie" as MediaType,
      region,
      genres: genreIds.length ? genreIds : undefined,
      providers: providerIds.length ? providerIds : undefined,
      page,
    });

    const results = (data.results ?? []).map((it) => ({
      ...it,
      media_type: it.media_type ?? "movie",
    }));

    return NextResponse.json({
      results,
      page: data.page ?? page,
      total_pages: data.total_pages ?? 1,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
