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
    <div className="w-full max-w-[1200px] mx-auto px-6 pt-20">
      <div className="border border-zinc-200 rounded-2xl p-4 bg-white dark:bg-zinc-900 dark:border-zinc-700">
        <h1 className="text-2xl font-semibold tracking-tight mb-2 text-zinc-900 dark:text-white">Favorites</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          Lista simple (v1) basada en IDs de TMDB.
        </p>
        <div className="h-2.5" />
        <div className="flex gap-3 flex-wrap items-center">
          <Link
            href="/profile"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-transparent text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Volver a Profile
          </Link>
        </div>
      </div>

      <div className="h-3.5" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {(favorites ?? []).map((f) => (
          <Link
            key={`${f.media_type}-${f.tmdb_id}`}
            href={`/title/${f.media_type}/${f.tmdb_id}`}
            className="border border-zinc-200 rounded-2xl p-4 bg-white dark:bg-zinc-900 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            <div className="font-semibold text-zinc-900 dark:text-white">
              {String(f.media_type).toUpperCase()} #{f.tmdb_id}
            </div>
            <div className="text-zinc-600 dark:text-zinc-400 text-sm mt-1.5">
              Guardado: {new Date(String(f.created_at)).toLocaleDateString("es-AR")}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
