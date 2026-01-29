"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  UserCircle,
  UserRound,
  Bot,
  Ghost,
  Heart,
  Star,
  Film,
  Tv,
  Music,
  Camera,
  Coffee,
  Gamepad2,
  BookOpen,
  Palette,
  Smile,
  Cat,
  Dog,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { updateProfile } from "@/lib/actions/user";
import { cacheRemove, PROFILE_CACHE_KEY } from "@/lib/cache";
import { AvatarIconModal } from "./AvatarIconModal";

const AVATAR_ICON_MAP: Record<string, LucideIcon> = {
  User,
  UserCircle,
  UserRound,
  Bot,
  Ghost,
  Heart,
  Star,
  Film,
  Tv,
  Music,
  Camera,
  Coffee,
  Gamepad2,
  BookOpen,
  Palette,
  Smile,
  Cat,
  Dog,
};

type Props = {
  displayName: string;
  userEmail: string | null;
  avatarUrl: string | null;
  avatarIcon: string | null;
  avatarColor: string | null;
};

const DEFAULT_ICON = "User";
const DEFAULT_COLOR = "#6366f1";

export function AvatarSection({
  displayName,
  userEmail,
  avatarUrl,
  avatarIcon,
  avatarColor,
}: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const iconName = avatarIcon && avatarIcon in AVATAR_ICON_MAP ? avatarIcon : DEFAULT_ICON;
  const IconComponent = AVATAR_ICON_MAP[iconName] ?? User;
  const bubbleColor = avatarColor || DEFAULT_COLOR;

  const handleSaveAvatar = async (icon: string, color: string) => {
    await updateProfile({ avatar_icon: icon, avatar_color: color });
    cacheRemove(PROFILE_CACHE_KEY);
    window.dispatchEvent(new CustomEvent("profile-updated"));
    router.refresh();
  };

  return (
    <>
      <div className="flex flex-col items-center gap-4 shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-28 h-28 rounded-full object-cover border-2 border-white/20"
          />
        ) : (
          <div
            className="w-28 h-28 rounded-full border-2 border-white/20 flex items-center justify-center text-white"
            style={{ backgroundColor: bubbleColor }}
          >
            <IconComponent size={40} strokeWidth={1.5} className="text-white" />
          </div>
        )}
        <p className="text-white/60 text-xs">Foto que se ve en el navbar</p>
        {!avatarUrl && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-3 py-2 rounded-lg border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Elegir icono y color
          </button>
        )}
      </div>

      <AvatarIconModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentIcon={avatarIcon}
        currentColor={avatarColor}
        onSave={handleSaveAvatar}
      />
    </>
  );
}
