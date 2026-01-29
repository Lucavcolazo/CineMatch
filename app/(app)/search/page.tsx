import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { searchMulti, type MediaType } from "@/lib/tmdb";

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await props.searchParams;
  const query = (q ?? "").trim();

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  const results =
    query.length >= 2 ? await searchMulti(query) : { results: [] as any[] };

  const items = (results.results ?? [])
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .slice(0, 24);

  return (
    <div className="container">
      <div className="card">
        <div className="title">Search</div>
        <form className="row" action="/search" method="get">
          <input
            className="input"
            name="q"
            placeholder="Ej: Interstellar, Dark, Breaking Bad..."
            defaultValue={query}
          />
          <button className="button" type="submit">
            Buscar
          </button>
        </form>
        <div style={{ height: 10 }} />
        <p className="muted">
          {query.length < 2
            ? "Escribí al menos 2 caracteres."
            : `Resultados para “${query}”`}
        </p>
      </div>

      <div style={{ height: 14 }} />
      <div className="grid">
        {items.map((it) => {
          const mt = it.media_type as MediaType;
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

