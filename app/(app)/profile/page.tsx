import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updatePreferences } from "@/lib/actions/user";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login");

  const { data: prefs } = await supabase
    .from("preferences")
    .select("region, genres, providers")
    .eq("user_id", user.id)
    .maybeSingle();

  const region = (prefs?.region as string) || "AR";
  const genres = (prefs?.genres as number[]) || [];
  const providers = (prefs?.providers as number[]) || [];

  async function logout() {
    "use server";
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 pt-20">
      <div className="border border-zinc-200 rounded-2xl p-4 bg-white dark:bg-zinc-900 dark:border-zinc-700">
        <h1 className="text-2xl font-semibold tracking-tight mb-2 text-zinc-900 dark:text-white">Profile</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">Sesión: {user.email}</p>
        <div className="h-3" />
        <div className="flex gap-3 flex-wrap items-center">
          <a
            href="/profile/favorites"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-transparent text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Ver favoritos
          </a>
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>

      <div className="h-3.5" />
      <div className="border border-zinc-200 rounded-2xl p-4 bg-white dark:bg-zinc-900 dark:border-zinc-700">
        <div className="font-bold mb-2 text-zinc-900 dark:text-white">Preferencias (v1)</div>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2.5">
          Esto es una edición simple por texto (v1). Más adelante lo mejoramos con selectores.
        </p>
        <form
          action={async (formData: FormData) => {
            "use server";
            const region = String(formData.get("region") ?? "AR").trim().toUpperCase() || "AR";
            const genresRaw = String(formData.get("genres") ?? "").trim();
            const providersRaw = String(formData.get("providers") ?? "").trim();

            const parseCsvInts = (s: string) =>
              s
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
                .map((x) => Number(x))
                .filter((n) => Number.isFinite(n)) as number[];

            await updatePreferences({
              region,
              genres: parseCsvInts(genresRaw),
              providers: parseCsvInts(providersRaw),
              nextPath: "/profile",
            });
          }}
          className="flex gap-3 flex-wrap items-stretch"
        >
          <input
            name="region"
            placeholder="Región (ej: AR, US, ES)"
            defaultValue={region}
            className="w-[220px] py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <input
            name="genres"
            placeholder="Géneros TMDB (CSV) ej: 18,35"
            defaultValue={genres.join(",")}
            className="min-w-[260px] flex-1 py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <input
            name="providers"
            placeholder="Providers TMDB (CSV) ej: 8,119"
            defaultValue={providers.join(",")}
            className="min-w-[260px] flex-1 py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
}
