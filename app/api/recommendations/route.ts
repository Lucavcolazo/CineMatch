import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRecommendations, type MediaType } from "@/lib/tmdb";

/**
 * GET /api/recommendations?page=1
 * Devuelve una página de recomendaciones basadas en los títulos que el usuario marcó como vistos.
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

  const { data: watchedRows } = await supabase
    .from("watched")
    .select("tmdb_id, media_type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!watchedRows?.length) {
    return NextResponse.json({
      results: [],
      page: 1,
      total_pages: 1,
    });
  }

  const watchedKeys = new Set(
    watchedRows.map((r) => `${r.media_type}-${r.tmdb_id}`)
  );
  const seenKeys = new Set<string>(watchedKeys);
  const results: { id: number; media_type: MediaType; title?: string; name?: string; poster_path?: string | null; vote_average?: number }[] = [];

  try {
    const recs = await Promise.allSettled(
      watchedRows.map((row) =>
        getRecommendations(row.media_type as MediaType, row.tmdb_id, page)
      )
    );

    for (const r of recs) {
      if (r.status !== "fulfilled" || !r.value?.results) continue;
      for (const it of (r.value.results as { id: number; media_type?: string; title?: string; name?: string; poster_path?: string | null; vote_average?: number }[]).slice(0, 8)) {
        const mt = it.media_type === "movie" || it.media_type === "tv" ? it.media_type : null;
        if (!mt) continue;
        const key = `${mt}-${it.id}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        results.push({
          id: it.id,
          media_type: mt,
          title: it.title,
          name: it.name,
          poster_path: it.poster_path ?? null,
          vote_average: it.vote_average,
        });
      }
    }

    return NextResponse.json({
      results,
      page,
      total_pages: results.length > 0 ? Math.max(page + 1, 10) : 1,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
