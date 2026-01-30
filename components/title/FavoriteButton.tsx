"use client";

import { useState } from "react";
import { toggleFavorite } from "@/lib/actions/user";
import type { MediaType } from "@/lib/tmdb";

type Props = {
  tmdbId: number;
  mediaType: MediaType;
  currentPath: string;
  label: string;
};

export function FavoriteButton({ tmdbId, mediaType, currentPath, label }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await toggleFavorite({
        tmdbId,
        mediaType,
        nextPath: currentPath,
      });
    } catch {
      // Ignorar; el servidor puede haber hecho redirect.
    }
    setLoading(false);
    window.location.href = currentPath;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-60"
    >
      {loading ? "…" : label}
    </button>
  );
}
