import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGenreMovieList } from "@/lib/tmdb";
import { AvatarSection } from "@/components/profile/AvatarSection";
import { ProfileNameForm } from "@/components/profile/ProfileNameForm";
import { ProfilePreferencesForm } from "@/components/profile/ProfilePreferencesForm";

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

  const regions = (prefs?.regions as string[] | null) ?? (prefs?.region ? [prefs.region as string] : ["AR"]);
  const genres = (prefs?.genres as number[]) ?? [];
  const providers = (prefs?.providers as number[]) ?? [];
  const displayName = (profile?.display_name as string) ?? "";
  const avatarUrl = (profile?.avatar_url as string) ?? null;
  const avatarIcon = (profile?.avatar_icon as string) ?? null;
  const avatarColor = (profile?.avatar_color as string) ?? null;

  const { genres: genreList } = await getGenreMovieList();

  return (
    <div className="min-h-screen bg-black text-white pt-[57px]">
      <div className="w-full max-w-[1200px] mx-auto px-6 py-8">
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

        <div className="border border-white/10 rounded-2xl p-6 bg-zinc-900/50 mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">Perfil</h2>
          <div className="flex gap-3 flex-wrap items-center mt-4">
            <a
              href="/profile/favorites"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Ver favoritos
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
      </div>
    </div>
  );
}
