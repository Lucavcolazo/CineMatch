import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MediaType } from "@/lib/tmdb";

// Server Actions para mutaciones del usuario (favoritos/ratings/preferencias).
// Comentarios en español por requerimiento del proyecto.

export async function toggleFavorite(params: {
  tmdbId: number;
  mediaType: MediaType;
  nextPath?: string;
}) {
  "use server";
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { tmdbId, mediaType, nextPath } = params;

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("favorites").delete().eq("id", existing.id);
  } else {
    await supabase.from("favorites").insert({
      user_id: user.id,
      tmdb_id: tmdbId,
      media_type: mediaType,
    });
  }

  if (nextPath) redirect(nextPath);
}

export async function upsertRating(params: {
  tmdbId: number;
  mediaType: MediaType;
  rating: number;
  nextPath?: string;
}) {
  "use server";
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { tmdbId, mediaType, rating, nextPath } = params;

  await supabase.from("ratings").upsert(
    {
      user_id: user.id,
      tmdb_id: tmdbId,
      media_type: mediaType,
      rating,
    },
    { onConflict: "user_id,tmdb_id,media_type" }
  );

  if (nextPath) redirect(nextPath);
}

export async function updatePreferences(params: {
  region: string;
  genres: number[];
  providers: number[];
  nextPath?: string;
}) {
  "use server";
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { region, genres, providers, nextPath } = params;

  await supabase.from("preferences").upsert(
    {
      user_id: user.id,
      region,
      genres,
      providers,
    },
    { onConflict: "user_id" }
  );

  if (nextPath) redirect(nextPath);
}

