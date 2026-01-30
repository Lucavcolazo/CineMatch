import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTitleDetails } from "@/lib/tmdb";
import type { MediaType } from "@/lib/tmdb";
import { WatchedClient } from "@/components/profile/WatchedClient";

export const dynamic = "force-dynamic";

const MAX_WATCHED = 50;

export default async function WatchedPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login");

  const { data: prefs } = await supabase
    .from("preferences")
    .select("region, regions")
    .eq("user_id", user.id)
    .maybeSingle();

  const regions = (prefs?.regions as string[] | null) ?? (prefs?.region ? [prefs.region as string] : []);
  const region = regions[0] ?? "AR";

  const { data: watchedRows } = await supabase
    .from("watched")
    .select("tmdb_id, media_type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(MAX_WATCHED);

  const items: { id: number; media_type: MediaType; title?: string; name?: string; poster_path?: string | null }[] = [];

  if (watchedRows?.length) {
    const results = await Promise.allSettled(
      watchedRows.map((row) =>
        getTitleDetails(row.media_type as MediaType, row.tmdb_id)
      )
    );
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled" && r.value) {
        const d = r.value;
        items.push({
          id: watchedRows[i].tmdb_id,
          media_type: watchedRows[i].media_type as MediaType,
          title: d.title,
          name: d.name,
          poster_path: d.poster_path ?? null,
        });
      }
    }
  }

  return <WatchedClient initialItems={items} region={region} />;
}
