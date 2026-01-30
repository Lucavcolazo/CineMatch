import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTitleDetails, getWatchProviders } from "@/lib/tmdb";
import type { MediaType } from "@/lib/tmdb";
import { StatsView } from "@/components/profile/StatsView";

export const dynamic = "force-dynamic";

const MAX_WATCHED_STATS = 80;
const MAX_PROVIDERS_SAMPLE = 30;

export default async function ProfileStatsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login");

  const { data: watchedRows } = await supabase
    .from("watched")
    .select("tmdb_id, media_type, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(MAX_WATCHED_STATS);

  const watchedMovies = watchedRows?.filter((r) => r.media_type === "movie").length ?? 0;
  const watchedSeries = watchedRows?.filter((r) => r.media_type === "tv").length ?? 0;

  let topGenres: { name: string; count: number }[] = [];
  let topProviders: { name: string; count: number }[] = [];
  let movieMinutes = 0;

  if (watchedRows?.length) {
    const detailsRes = await Promise.allSettled(
      watchedRows.map((row) =>
        getTitleDetails(row.media_type as MediaType, row.tmdb_id)
      )
    );

    const genreCount = new Map<string, number>();
    const providerCount = new Map<string, number>();

    for (let i = 0; i < detailsRes.length; i++) {
      const r = detailsRes[i];
      if (r.status !== "fulfilled" || !r.value) continue;
      const d = r.value;
      const row = watchedRows[i];

      if (row.media_type === "movie" && d.runtime) {
        movieMinutes += d.runtime;
      }

      for (const g of d.genres ?? []) {
        const name = g.name ?? "";
        if (name) genreCount.set(name, (genreCount.get(name) ?? 0) + 1);
      }
    }

    topGenres = Array.from(genreCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const providerSample = watchedRows.slice(0, MAX_PROVIDERS_SAMPLE);
    const providersRes = await Promise.allSettled(
      providerSample.map((row) =>
        getWatchProviders(row.media_type as MediaType, row.tmdb_id)
      )
    );

    for (const r of providersRes) {
      if (r.status !== "fulfilled" || !r.value?.results?.AR?.flatrate) continue;
      for (const p of r.value.results.AR.flatrate) {
        const name = p.provider_name ?? "";
        if (name) providerCount.set(name, (providerCount.get(name) ?? 0) + 1);
      }
    }

    topProviders = Array.from(providerCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }

  return (
    <StatsView
      watchedMovies={watchedMovies}
      watchedSeries={watchedSeries}
      topGenres={topGenres}
      topProviders={topProviders}
      movieMinutes={movieMinutes}
    />
  );
}
