import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRecommendations, type MediaType } from "@/lib/tmdb";
import { RecommendationsClient } from "@/components/recommendations/RecommendationsClient";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

const DEFAULT_REGION = "AR";

export default async function RecommendationsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white pt-[110px] lg:pt-[57px] flex flex-col items-center justify-center">
        <p className="text-white/80">Iniciá sesión para ver tus recomendaciones.</p>
        <Footer />
      </div>
    );
  }

  const { data: watchedRows } = await supabase
    .from("watched")
    .select("tmdb_id, media_type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!watchedRows?.length) {
    return (
      <div className="min-h-screen bg-black text-white pt-[110px] lg:pt-[57px] flex flex-col items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="text-white/90 mb-4">
            Marcá películas o series como vistas en Descubrir para ver recomendaciones personalizadas.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-black hover:bg-white/90 transition-colors"
          >
            Ir a Descubrir
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const watchedKeys = new Set(
    watchedRows.map((r) => `${r.media_type}-${r.tmdb_id}`)
  );

  type Item = {
    id: number;
    media_type: MediaType;
    title?: string;
    name?: string;
    poster_path?: string | null;
    vote_average?: number;
  };

  const seenKeys = new Set<string>(watchedKeys);
  const items: Item[] = [];

  try {
    const recs = await Promise.allSettled(
      watchedRows.map((row) =>
        getRecommendations(row.media_type as MediaType, row.tmdb_id, 1)
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
        items.push({
          id: it.id,
          media_type: mt,
          title: it.title,
          name: it.name,
          poster_path: it.poster_path ?? null,
          vote_average: it.vote_average,
        });
      }
    }
  } catch (err) {
    return (
      <div className="min-h-screen bg-black text-white pt-[110px] lg:pt-[57px] flex flex-col items-center justify-center px-4">
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-[110px] lg:pt-[57px]">
      <RecommendationsClient
        initialItems={items}
        region={DEFAULT_REGION}
      />
      <Footer />
    </div>
  );
}
