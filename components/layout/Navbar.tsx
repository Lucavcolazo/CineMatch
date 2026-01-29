"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Popcorn } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useEffect, useRef, useState } from "react";
import { ProfileDropdown } from "./ProfileDropdown";
import { cacheGet, cacheSet, cacheRemove, PROFILE_CACHE_KEY, PROFILE_CACHE_TTL_MS } from "@/lib/cache";

type Profile = {
  avatar_url: string | null;
  display_name: string | null;
  avatar_icon: string | null;
  avatar_color: string | null;
} | null;

export function Navbar() {
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [profile, setProfile] = useState<Profile>(null);
  const [envMissing, setEnvMissing] = useState(false);
  const refetchProfileRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url?.trim() || !anonKey?.trim()) {
        setEnvMissing(true);
        return;
      }

      const supabase = createSupabaseBrowserClient();

      const loadUser = async (userId: string, email: string) => {
        const cached = cacheGet<{ userId: string; email: string; profile: Profile }>(PROFILE_CACHE_KEY);
        if (cached?.userId === userId) {
          setIsAuthed(true);
          setUserEmail(cached.email);
          setProfile(cached.profile);
          return;
        }

        setIsAuthed(true);
        setUserEmail(email);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_url, display_name, avatar_icon, avatar_color")
          .eq("id", userId)
          .maybeSingle();

        const profileValue = profileData ?? null;
        setProfile(profileValue);
        cacheSet(PROFILE_CACHE_KEY, { userId, email, profile: profileValue }, PROFILE_CACHE_TTL_MS);
      };

      const clearUser = () => {
        setIsAuthed(false);
        setUserEmail("");
        setProfile(null);
        cacheRemove(PROFILE_CACHE_KEY);
      };

      const refetchProfile = async () => {
        const { data } = await supabase.auth.getSession();
        const u = data.session?.user;
        if (u) await loadUser(u.id, u.email ?? "");
      };
      refetchProfileRef.current = refetchProfile;

      window.addEventListener("profile-updated", refetchProfile);

      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        const u = session?.user;
        if (u) void loadUser(u.id, u.email ?? "");
        else clearUser();
      });
      subscription = sub;

      const init = async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const user = sessionData.session?.user ?? (await supabase.auth.getUser()).data.user;
          if (user) void loadUser(user.id, user.email ?? "");
          else clearUser();
        } catch {
          clearUser();
        }
      };

      void init();

      return () => {
        subscription?.unsubscribe?.();
        window.removeEventListener("profile-updated", refetchProfile);
      };
    } catch {
      setEnvMissing(true);
    }

    return () => {};
  }, []);

  // Al entrar a /profile, invalidar caché y refrescar perfil en navbar.
  useEffect(() => {
    if (pathname === "/profile") {
      cacheRemove(PROFILE_CACHE_KEY);
      refetchProfileRef.current?.();
    }
  }, [pathname]);

  const getNavOptions = () => {
    if (pathname === "/") {
      return {
        left: null,
        right: null,
        actions: (
          <>
            <Link
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium border border-white/30 bg-white text-black hover:bg-white/90 transition-colors"
              href="/login"
            >
              Iniciar sesión
            </Link>
            <Link
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-black border border-white hover:bg-white/90 transition-colors"
              href="/signup"
            >
              Registrarse
            </Link>
          </>
        ),
      };
    }

    if (pathname.startsWith("/login")) {
      return { left: null, right: null, actions: null };
    }
    if (pathname.startsWith("/signup")) {
      return { left: null, right: null, actions: null };
    }
    if (pathname.startsWith("/forgot-password")) {
      return { left: null, right: null, actions: null };
    }
    if (pathname.startsWith("/reset-password")) {
      return { left: null, right: null, actions: null };
    }

    // Rutas de la app: el middleware ya exige sesión, mostramos solo el menú de perfil.
    const navDark = true;
    const appActions = (
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <ProfileDropdown profile={profile} userEmail={userEmail} navDark={navDark} />
      </div>
    );

    if (pathname.startsWith("/discover")) {
      return { left: null, right: null, actions: appActions };
    }
    if (pathname.startsWith("/search")) {
      return { left: { href: "/discover", label: "Descubrir" }, right: null, actions: appActions };
    }
    if (pathname.startsWith("/profile")) {
      return { left: { href: "/discover", label: "Descubrir" }, right: null, actions: appActions };
    }
    if (pathname.startsWith("/title")) {
      return { left: null, right: null, actions: appActions };
    }

    return { left: null, right: null, actions: null };
  };

  const options = getNavOptions();
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");
  const isLanding = pathname === "/";
  const isAppPage =
    pathname.startsWith("/discover") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/title");

  const navDark = isLanding || isAuthPage || isAppPage;
  const navBg = navDark ? "bg-black border-white/10" : "bg-white border-black/10 shadow-sm";
  const brandColor = navDark ? "text-white hover:opacity-80" : "text-black hover:opacity-70";
  const navBtnBase = "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors";
  const navBtnStyle =
    navDark
      ? "border border-white/20 text-white hover:bg-white/10"
      : "border border-black/15 text-black hover:bg-black/5";

  return (
    <>
      {envMissing && (
        <div className="fixed top-0 left-0 right-0 z-[1001] bg-amber-600 text-black text-center py-2 px-4 text-sm font-medium">
          Agregá <code className="bg-black/20 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code className="bg-black/20 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en{" "}
          <code className="bg-black/20 px-1 rounded">.env.local</code> (raíz del proyecto) y reiniciá con{" "}
          <code className="bg-black/20 px-1 rounded">npm run dev</code>.
        </div>
      )}
      <nav className={`fixed top-0 left-0 right-0 z-[1000] border-b ${navBg}`}>
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={
              pathname.startsWith("/discover") ||
              pathname.startsWith("/search") ||
              pathname.startsWith("/profile") ||
              pathname.startsWith("/title")
                ? "/discover"
                : isAuthed
                  ? "/discover"
                  : "/"
            }
            className={`inline-flex items-center gap-2 font-bold text-lg tracking-tight ${brandColor} transition-opacity`}
          >
            <Popcorn size={22} aria-hidden="true" />
            <span>CineMatch</span>
          </Link>
          {options.left ? (
            <Link href={options.left.href} className={`${navBtnBase} ${navBtnStyle}`}>
              <ArrowLeft size={18} aria-hidden="true" />
              <span>{options.left.label}</span>
            </Link>
          ) : null}
        </div>

        {options.actions ? (
          <div className="flex items-center gap-2.5 flex-shrink-0">{options.actions}</div>
        ) : null}
      </div>
    </nav>
    </>
  );
}
