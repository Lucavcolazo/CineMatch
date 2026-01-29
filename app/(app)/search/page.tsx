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
    <div className="w-full max-w-[1200px] mx-auto px-6 pt-20">
      <div className="border border-zinc-200 rounded-2xl p-4 bg-white dark:bg-zinc-900 dark:border-zinc-700">
        <h1 className="text-2xl font-semibold tracking-tight mb-2 text-zinc-900 dark:text-white">Search</h1>
        <form className="flex gap-3 flex-wrap items-stretch" action="/search" method="get">
          <input
            name="q"
            placeholder="Ej: Interstellar, Dark, Breaking Bad..."
            defaultValue={query}
            className="flex-1 min-w-[200px] py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Buscar
          </button>
        </form>
        <div className="h-2.5" />
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          {query.length < 2
            ? "Escribí al menos 2 caracteres."
            : `Resultados para "${query}"`}
        </p>
      </div>

      <div className="h-3.5" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((it) => {
          const mt = it.media_type as MediaType;
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
