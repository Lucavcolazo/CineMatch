import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGenreMovieList } from "@/lib/tmdb";
import { getWatchedCount } from "@/lib/actions/user";
import { ProfileLayoutClient } from "@/components/profile/ProfileLayoutClient";
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

        {/* New two-column layout with Lanyard */}
        <ProfileLayoutClient
          displayName={displayName}
          userEmail={user.email ?? null}
          avatarUrl={avatarUrl}
          avatarIcon={avatarIcon}
          avatarColor={avatarColor}
          watchedCount={watchedCount}
        />

        {/* Preferences */}
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
