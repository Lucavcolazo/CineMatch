"use server";

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
  regions: string[];
  genres: number[];
  providers: number[];
  nextPath?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { regions, genres, providers, nextPath } = params;
  const region = regions[0] ?? "AR";

  await supabase.from("preferences").upsert(
    {
      user_id: user.id,
      region,
      regions: regions.length ? regions : [],
      genres,
      providers,
    },
    { onConflict: "user_id" }
  );

  if (nextPath) redirect(nextPath);
}

export async function updateProfile(params: {
  display_name?: string;
  avatar_url?: string | null;
  avatar_icon?: string | null;
  avatar_color?: string | null;
  nextPath?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { display_name, avatar_url, avatar_icon, avatar_color, nextPath } = params;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (display_name !== undefined) updates.display_name = display_name;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url;
  if (avatar_icon !== undefined) updates.avatar_icon = avatar_icon;
  if (avatar_color !== undefined) updates.avatar_color = avatar_color;

  await supabase.from("profiles").upsert(
    { id: user.id, ...updates },
    { onConflict: "id" }
  );

  if (nextPath) redirect(nextPath);
}

// --- Vistas (watched): marcar / desmarcar "La vi" y consultar estado ---

export async function toggleWatched(params: {
  tmdbId: number;
  mediaType: MediaType;
  nextPath?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { tmdbId, mediaType, nextPath } = params;

  const { data: existing } = await supabase
    .from("watched")
    .select("id")
    .eq("user_id", user.id)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("watched").delete().eq("id", existing.id);
  } else {
    await supabase.from("watched").insert({
      user_id: user.id,
      tmdb_id: tmdbId,
      media_type: mediaType,
    });
  }

  if (nextPath) redirect(nextPath);
}

/** Devuelve si el usuario tiene marcado este título como visto. */
export async function getWatchedStatus(params: {
  tmdbId: number;
  mediaType: MediaType;
}): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("watched")
    .select("id")
    .eq("user_id", user.id)
    .eq("tmdb_id", params.tmdbId)
    .eq("media_type", params.mediaType)
    .maybeSingle();

  return Boolean(data?.id);
}

/** Devuelve la cantidad de títulos que el usuario marcó como vistos. */
export async function getWatchedCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("watched")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) return 0;
  return count ?? 0;
}


