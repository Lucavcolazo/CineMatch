import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { discoverTitles, type MediaType } from "@/lib/tmdb";

export default async function DiscoverPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const { data: prefs } = user
    ? await supabase
        .from("preferences")
        .select("region, genres, providers")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null as any };

  const region = (prefs?.region as string) || "AR";
  const genres = (prefs?.genres as number[]) || [];
  const providers = (prefs?.providers as number[]) || [];

  const mediaType: MediaType = "movie";
  const page = await discoverTitles({ mediaType, region, genres, providers, page: 1 });
  const items = (page.results ?? []).filter((r) => r.media_type !== "person").slice(0, 12);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 pt-20">
      <div className="border border-zinc-200 rounded-2xl p-4 bg-white dark:bg-zinc-900 dark:border-zinc-700">
        <h1 className="text-2xl font-semibold tracking-tight mb-2 text-zinc-900 dark:text-white">Discover</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          Recomendaciones rápidas (v1) usando tus preferencias. Región: {region}.
        </p>
      </div>
      <div className="h-3.5" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((it) => {
          const mt = (it.media_type === "tv" ? "tv" : "movie") as MediaType;
          return (
            <Link
              key={`${mt}-${it.id}`}
              href={`/title/${mt}/${it.id}`}
              className="border border-zinc-200 rounded-2xl p-4 bg-white dark:bg-zinc-900 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
            >
              <div className="font-semibold text-zinc-900 dark:text-white">{it.title ?? it.name ?? "Sin título"}</div>
              <div className="text-zinc-600 dark:text-zinc-400 text-sm mt-1.5">
                {mt.toUpperCase()} · ⭐ {Number(it.vote_average ?? 0).toFixed(1)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
