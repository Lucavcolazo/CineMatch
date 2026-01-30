import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGenreMovieList } from "@/lib/tmdb";
import { getWatchedCount } from "@/lib/actions/user";
import { AvatarSection } from "@/components/profile/AvatarSection";
import { ProfileNameForm } from "@/components/profile/ProfileNameForm";
import { ProfilePreferencesForm } from "@/components/profile/ProfilePreferencesForm";
import { Footer } from "@/components/Footer";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, avatar_icon, avatar_color")
    .eq("id", user.id)
    .maybeSingle();

  const { data: prefs } = await supabase
    .from("preferences")
    .select("region, regions, genres, providers")
    .eq("user_id", user.id)
    .maybeSingle();

  const regions = (prefs?.regions as string[] | null) ?? (prefs?.region ? [prefs.region as string] : []);
  const genres = (prefs?.genres as number[]) ?? [];
  const providers = (prefs?.providers as number[]) ?? [];
  const displayName = (profile?.display_name as string) ?? "";
  const avatarUrl = (profile?.avatar_url as string) ?? null;
  const avatarIcon = (profile?.avatar_icon as string) ?? null;
  const avatarColor = (profile?.avatar_color as string) ?? null;

  const { genres: genreList } = await getGenreMovieList();
  const watchedCount = await getWatchedCount();

  return (
    <div className="min-h-screen bg-black text-white pt-[110px] lg:pt-[57px]">
      <div className="w-full max-w-[1200px] mx-auto px-6 py-8">
        <Link
          href="/discover"
          className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-6 transition-colors"
        >
          ← Volver a Descubrir
        </Link>
        <h1 className="text-2xl font-bold text-white mb-8">Mi perfil</h1>

        {/* Información del usuario: email, nombre, avatar (imagen o icono+color) */}
        <div className="border border-white/10 rounded-2xl p-6 bg-zinc-900/50 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Información del usuario</h2>
          <div className="flex flex-col sm:flex-row gap-8">
            <AvatarSection
              displayName={displayName}
              userEmail={user.email ?? null}
              avatarUrl={avatarUrl}
              avatarIcon={avatarIcon}
              avatarColor={avatarColor}
            />
            <div className="flex-1 space-y-5 min-w-0">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={user.email ?? ""}
                  readOnly
                  className="w-full max-w-md rounded-lg border border-white/20 bg-white/5 text-white px-3 py-2 text-sm cursor-not-allowed"
                />
              </div>
              <ProfileNameForm initialDisplayName={displayName} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="border border-white/10 rounded-2xl p-6 bg-zinc-900/50">
            <h2 className="text-xl font-semibold text-white mb-2">Películas y series vistas</h2>
            <p className="text-white/70 text-sm mb-4">
              Total: <strong className="text-white">{watchedCount}</strong>
            </p>
            <a
              href="/profile/watched"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Ver películas/series vistas
            </a>
          </div>
          <div className="border border-white/10 rounded-2xl p-6 bg-zinc-900/50">
            <h2 className="text-xl font-semibold text-white mb-2">Estadísticas</h2>
            <p className="text-white/70 text-sm mb-4">
              Resumen de tu actividad y gustos.
            </p>
            <a
              href="/profile/stats"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Ver estadísticas
            </a>
          </div>
        </div>

        <div className="border border-white/10 rounded-2xl p-6 bg-zinc-900/50">
          <div className="font-bold mb-2 text-white">Preferencias</div>
          <ProfilePreferencesForm
            genres={genreList ?? []}
            initialRegions={regions}
            initialGenres={genres}
            initialProviders={providers}
          />
        </div>
        <Footer />
      </div>
    </div>
  );
}
