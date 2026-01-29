import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function FavoritesPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login");

  const { data: favorites } = await supabase
    .from("favorites")
    .select("tmdb_id, media_type, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container">
      <div className="card">
        <div className="title">Favorites</div>
        <p className="muted">Lista simple (v1) basada en IDs de TMDB.</p>
        <div style={{ height: 10 }} />
        <div className="row">
          <Link className="button buttonSecondary" href="/profile">
            Volver a Profile
          </Link>
        </div>
      </div>

      <div style={{ height: 14 }} />
      <div className="grid">
        {(favorites ?? []).map((f) => (
          <Link
            key={`${f.media_type}-${f.tmdb_id}`}
            className="card"
            href={`/title/${f.media_type}/${f.tmdb_id}`}
          >
            <div style={{ fontWeight: 600 }}>
              {String(f.media_type).toUpperCase()} #{f.tmdb_id}
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              Guardado: {new Date(String(f.created_at)).toLocaleDateString("es-AR")}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

