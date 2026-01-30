"use client";

import { useState } from "react";
import Link from "next/link";
import { TitleCard } from "@/components/discover/TitleCard";
import { TitleModal } from "@/components/discover/TitleModal";
import { Footer } from "@/components/Footer";
import type { MediaType } from "@/lib/tmdb";

type WatchedItem = {
  id: number;
  media_type: MediaType;
  title?: string;
  name?: string;
  poster_path?: string | null;
};

type Props = {
  initialItems: WatchedItem[];
  region: string;
};

export function WatchedClient({ initialItems, region }: Props) {
  const [modal, setModal] = useState<{ mediaType: MediaType; id: number } | null>(null);

  const title = (it: WatchedItem) => it.title ?? it.name ?? "Sin título";

  return (
    <div className="min-h-screen bg-black text-white pt-[57px]">
      <div className="w-full max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/profile"
            className="text-white/70 hover:text-white text-sm transition-colors"
          >
            ← Volver al perfil
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Películas y series vistas</h1>
        <p className="text-white/70 text-sm mb-8">
          {initialItems.length === 0
            ? "Aún no marcaste ningún título como visto. Abrí uno desde Descubrir o Mis recomendaciones y usá «La vi»."
            : `${initialItems.length} título${initialItems.length === 1 ? "" : "s"}`}
        </p>

        {initialItems.length === 0 ? null : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {initialItems.map((it) => (
              <TitleCard
                key={`${it.media_type}-${it.id}`}
                id={it.id}
                mediaType={it.media_type}
                title={title(it)}
                posterPath={it.poster_path ?? null}
                onSelect={() => setModal({ mediaType: it.media_type, id: it.id })}
                region={region}
              />
            ))}
          </div>
        )}
      </div>

      {modal ? (
        <TitleModal
          mediaType={modal.mediaType}
          id={modal.id}
          region={region}
          onClose={() => setModal(null)}
        />
      ) : null}
        <Footer />
    </div>
  );
}
