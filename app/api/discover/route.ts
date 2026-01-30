import { NextResponse } from "next/server";
import { discoverTitles, getReleaseDateParams, type MediaType } from "@/lib/tmdb";

type MediaFilter = "movie" | "tv" | "both";

/**
 * GET /api/discover?page=1&region=AR&media=movie|tv|both&genres=...&providers=...&year_from=...&year_to=...
 * Orden automático: películas por release_date.desc, series por first_air_date.desc.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const region = searchParams.get("region") || "AR";
  const mediaParam = searchParams.get("media");
  const media: MediaFilter =
    mediaParam === "tv" ? "tv" : mediaParam === "movie" ? "movie" : "both";
  const genresParam = searchParams.get("genres");
  const providersParam = searchParams.get("providers");
  const yearFromParam = searchParams.get("year_from");
  const yearToParam = searchParams.get("year_to");

  const page = Math.max(1, Number(pageParam) || 1);
  const genreIds = genresParam
    ? genresParam.split(",").map(Number).filter(Number.isFinite)
    : [];
  const providerIds = providersParam
    ? providersParam.split(",").map(Number).filter(Number.isFinite)
    : [];
  const yearFrom = yearFromParam ? Number(yearFromParam) : undefined;
  const yearTo = yearToParam ? Number(yearToParam) : undefined;
  const {
    primaryReleaseDateGte,
    primaryReleaseDateLte,
    firstAirDateGte,
    firstAirDateLte,
  } = getReleaseDateParams(yearFrom, yearTo);

  try {
    if (media === "both") {
      const [movieRes, tvRes] = await Promise.all([
        discoverTitles({
          mediaType: "movie",
          region,
          genres: genreIds.length ? genreIds : undefined,
          providers: providerIds.length ? providerIds : undefined,
          page,
          sortBy: "release_date.desc",
          primaryReleaseDateGte,
          primaryReleaseDateLte,
        }),
        discoverTitles({
          mediaType: "tv",
          region,
          genres: genreIds.length ? genreIds : undefined,
          providers: providerIds.length ? providerIds : undefined,
          page,
          sortBy: "first_air_date.desc",
          firstAirDateGte,
          firstAirDateLte,
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
      const total_pages = Math.max(
        movieRes.total_pages ?? 1,
        tvRes.total_pages ?? 1
      );
      return NextResponse.json({ results, page, total_pages });
    }

    const mediaType: MediaType = media === "tv" ? "tv" : "movie";
    const data = await discoverTitles({
      mediaType,
      region,
      genres: genreIds.length ? genreIds : undefined,
      providers: providerIds.length ? providerIds : undefined,
      page,
      sortBy: mediaType === "tv" ? "first_air_date.desc" : "release_date.desc",
      primaryReleaseDateGte,
      primaryReleaseDateLte,
      firstAirDateGte,
      firstAirDateLte,
    });

    const results = (data.results ?? []).map((it) => ({
      ...it,
      media_type: (it.media_type ?? mediaType) as MediaType,
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
