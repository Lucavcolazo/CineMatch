"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateProfile } from "@/lib/actions/user";
import { cacheRemove, PROFILE_CACHE_KEY } from "@/lib/cache";
import { ProfileNameModal } from "./ProfileNameModal";
import { AvatarIconModal } from "./AvatarIconModal";

// Dynamically import LanyardCard to avoid SSR issues with Three.js
const LanyardCard = dynamic(() => import("./LanyardCard"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[600px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-white/50 text-sm">Cargando tarjeta...</p>
      </div>
    </div>
  ),
});

type Props = {
  displayName: string;
  userEmail: string | null;
  avatarUrl: string | null;
  avatarIcon: string | null;
  avatarColor: string | null;
  watchedCount: number;
};

export function ProfileLayoutClient({
  displayName,
  userEmail,
  avatarUrl,
  avatarIcon,
  avatarColor,
  watchedCount,
}: Props) {
  const router = useRouter();
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [iconModalOpen, setIconModalOpen] = useState(false);

  const userName = displayName || userEmail?.split("@")[0] || "Usuario";

  const handleSaveAvatar = async (icon: string, color: string) => {
    await updateProfile({ avatar_icon: icon, avatar_color: color });
    cacheRemove(PROFILE_CACHE_KEY);
    window.dispatchEvent(new CustomEvent("profile-updated"));
    router.refresh();
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Right Column - Lanyard Card (Rendered first on Mobile, Second on Desktop) */}
        <div className="flex items-start justify-center min-h-[600px] -mt-24 lg:-mt-4 order-1 lg:order-2 relative z-0 pointer-events-none">
           <div className="w-full h-full pointer-events-auto">
             <LanyardCard 
              position={[0, 0, 18]} 
              gravity={[0, -40, 0]} 
              displayName={userName}
              avatarIcon={avatarIcon}
              avatarColor={avatarColor}
              avatarUrl={avatarUrl}
              watchedCount={watchedCount}
            />
          </div>
        </div>

        {/* Left Column - Options (Rendered second on Mobile, First on Desktop) */}
        <div className="space-y-4 order-2 lg:order-1 relative z-10">
          {/* Cambiar datos */}
          <div className="border border-white/10 rounded-2xl p-6 bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-white mb-4">Cambiar datos</h2>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setNameModalOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Nombre
              </button>
              <button
                type="button"
                onClick={() => setIconModalOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Icono y color
              </button>
            </div>
          </div>

          {/* Películas y series vistas */}
          <div className="border border-white/10 rounded-2xl p-6 bg-zinc-900/50">
            <h2 className="text-xl font-semibold text-white mb-2">Películas y series vistas</h2>
            <p className="text-white/70 text-sm mb-4">
              Total: <strong className="text-white">{watchedCount}</strong>
            </p>
            <Link
              href="/profile/watched"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Ver todas las películas/series
            </Link>
          </div>

          {/* Estadísticas */}
          <div className="border border-white/10 rounded-2xl p-6 bg-zinc-900/50">
            <h2 className="text-xl font-semibold text-white mb-2">Estadísticas</h2>
            <p className="text-white/70 text-sm mb-4">
              Resumen de tu actividad y gustos.
            </p>
            <Link
              href="/profile/stats"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Ver estadísticas
            </Link>
          </div>
        </div>

      </div>

      {/* Modals */}
      <ProfileNameModal
        isOpen={nameModalOpen}
        onClose={() => setNameModalOpen(false)}
        initialDisplayName={displayName}
      />

      <AvatarIconModal
        isOpen={iconModalOpen}
        onClose={() => setIconModalOpen(false)}
        currentIcon={avatarIcon}
        currentColor={avatarColor}
        onSave={handleSaveAvatar}
      />
    </>
  );
}
