import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { discoverTitles, type MediaType } from "@/lib/tmdb";

export default async function DiscoverPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  // Middleware ya protege, pero dejamos esto por seguridad.
  const user = data.user;

  // Preferencias (v1): si no hay, usamos defaults.
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
    <div className="container">
      <div className="card">
        <div className="title">Discover</div>
        <p className="muted">
          Recomendaciones rápidas (v1) usando tus preferencias. Región: {region}.
        </p>
      </div>
      <div style={{ height: 14 }} />
      <div className="grid">
        {items.map((it) => {
          const mt = (it.media_type === "tv" ? "tv" : "movie") as MediaType;
          return (
            <Link key={`${mt}-${it.id}`} className="card" href={`/title/${mt}/${it.id}`}>
              <div style={{ fontWeight: 600 }}>{it.title ?? it.name ?? "Sin título"}</div>
              <div className="muted" style={{ marginTop: 6 }}>
                {mt.toUpperCase()} · ⭐ {Number(it.vote_average ?? 0).toFixed(1)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

