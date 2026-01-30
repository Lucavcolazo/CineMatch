"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { User, LogOut, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cacheRemove, PROFILE_CACHE_KEY } from "@/lib/cache";

type Profile = {
  avatar_url: string | null;
  display_name: string | null;
  avatar_icon: string | null;
  avatar_color: string | null;
} | null;

type Props = {
  profile: Profile;
  userEmail: string;
  navDark: boolean;
};

const AVATAR_ICON_MAP: Record<string, LucideIcon> = {
  User: LucideIcons.User,
  UserCircle: LucideIcons.UserCircle,
  UserRound: LucideIcons.UserRound,
  Bot: LucideIcons.Bot,
  Ghost: LucideIcons.Ghost,
  Heart: LucideIcons.Heart,
  Star: LucideIcons.Star,
  Film: LucideIcons.Film,
  Tv: LucideIcons.Tv,
  Music: LucideIcons.Music,
  Camera: LucideIcons.Camera,
  Coffee: LucideIcons.Coffee,
  Gamepad2: LucideIcons.Gamepad2,
  BookOpen: LucideIcons.BookOpen,
  Palette: LucideIcons.Palette,
  Smile: LucideIcons.Smile,
  Cat: LucideIcons.Cat,
  Dog: LucideIcons.Dog,
};

function getAvatarIconComponent(iconName: string | null): LucideIcon {
  if (iconName && iconName in AVATAR_ICON_MAP) return AVATAR_ICON_MAP[iconName];
  return User;
}

export function ProfileDropdown({ profile, userEmail, navDark }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    cacheRemove(PROFILE_CACHE_KEY);
    window.location.href = "/";
  };

  // Mostrar siempre el nombre del usuario: display_name, o parte del email.
  const displayName =
    (profile?.display_name?.trim() && profile.display_name) ||
    (userEmail && userEmail.split("@")[0]) ||
    "Invitado";

  const triggerClass = navDark
    ? "text-white/80 hover:text-white"
    : "text-black/80 hover:text-black";

  const AvatarIcon = getAvatarIconComponent(profile?.avatar_icon ?? null);
  const bubbleColor = profile?.avatar_color || "#6366f1";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center justify-center p-1 rounded-full ${triggerClass} transition-colors shrink-0 focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menú de perfil"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="w-8 h-8 rounded-full object-cover shrink-0 sm:w-7 sm:h-7"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white sm:w-7 sm:h-7"
            style={{ backgroundColor: bubbleColor }}
          >
            <AvatarIcon size={16} strokeWidth={2} className="sm:w-[14px] sm:h-[14px]" />
          </div>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-2 rounded-lg border border-white/20 bg-zinc-900 shadow-xl py-1 min-w-[200px] z-[1001]"
          role="menu"
        >
          <div className="px-4 py-2.5 border-b border-white/10">
            <p className="text-sm font-medium text-white truncate" title={displayName}>{displayName}</p>
            <p className="text-xs text-white/50 truncate" title={userEmail}>{userEmail}</p>
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/10"
            role="menuitem"
          >
            <User size={18} />
            Ver perfil
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              handleSignOut();
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/10 text-left"
            role="menuitem"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
