import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getTitleDetails,
  getWatchProviders,
  type MediaType,
  type TmdbProvider,
} from "@/lib/tmdb";
import { upsertRating } from "@/lib/actions/user";
import { FavoriteButton } from "@/components/title/FavoriteButton";

function pickProvidersForRegion(
  providers: Awaited<ReturnType<typeof getWatchProviders>>,
  region: string
) {
  const r = providers.results?.[region];
  const flatrate = (r?.flatrate ?? []) as TmdbProvider[];
  const rent = (r?.rent ?? []) as TmdbProvider[];
  const buy = (r?.buy ?? []) as TmdbProvider[];
  return { link: r?.link, flatrate, rent, buy };
}

export default async function TitlePage(props: {
  params: Promise<{ mediaType: MediaType; id: string }>;
}) {
  const { mediaType, id } = await props.params;
  const tmdbId = Number(id);

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const { data: prefs } = user
    ? await supabase.from("preferences").select("region").eq("user_id", user.id).maybeSingle()
    : { data: null as any };
  const region = (prefs?.region as string) || "AR";

  const { data: fav } = user
    ? await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("tmdb_id", tmdbId)
        .eq("media_type", mediaType)
        .maybeSingle()
    : { data: null as any };

  const { data: ratingRow } = user
    ? await supabase
        .from("ratings")
        .select("rating")
        .eq("user_id", user.id)
        .eq("tmdb_id", tmdbId)
        .eq("media_type", mediaType)
        .maybeSingle()
    : { data: null as any };

  const details = await getTitleDetails(mediaType, tmdbId);
  const watch = await getWatchProviders(mediaType, tmdbId);
  const { link, flatrate, rent, buy } = pickProvidersForRegion(watch, region);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 pt-20">
      <div className="border border-zinc-200 rounded-2xl p-4 bg-white dark:bg-zinc-900 dark:border-zinc-700">
        <h1 className="text-2xl font-semibold tracking-tight mb-2 text-zinc-900 dark:text-white">
          {details.title ?? details.name ?? "Detalle"}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
          {details.overview || "Sin descripción."}
        </p>
        <div className="h-3" />
        <div className="flex gap-3 flex-wrap items-center">
          <Link
            href="/search"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-transparent text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Volver a Search
          </Link>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            >
              Ver en TMDB
            </a>
          ) : null}
        </div>

        {user ? (
          <>
            <div className="h-3.5" />
            <div className="flex gap-3 flex-wrap items-center">
              <FavoriteButton
                tmdbId={tmdbId}
                mediaType={mediaType}
                currentPath={`/title/${mediaType}/${tmdbId}`}
                label={fav?.id ? "Quitar de favoritos" : "Agregar a favoritos"}
              />

              <form action={async (formData: FormData) => {
                "use server";
                const rating = Number(formData.get("rating"));
                if (Number.isFinite(rating) && rating >= 1 && rating <= 10) {
                  await upsertRating({
                    tmdbId,
                    mediaType,
                    rating,
                    nextPath: `/title/${mediaType}/${tmdbId}`,
                  });
                }
              }} className="flex gap-3 flex-wrap items-center"
              >
                <input
                  name="rating"
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  defaultValue={ratingRow?.rating ?? ""}
                  placeholder="Rating (1-10)"
                  className="w-[180px] py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-zinc-400"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-transparent text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Guardar rating
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <div className="h-3.5" />
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Para guardar favoritos/ratings,{" "}
              <Link href="/login" className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-white">
                iniciá sesión
              </Link>
              .
            </p>
          </>
        )}
      </div>

      <div className="h-3.5" />
      <div className="border border-zinc-200 rounded-2xl p-4 bg-white dark:bg-zinc-900 dark:border-zinc-700">
        <div className="font-bold mb-2 text-zinc-900 dark:text-white">
          Plataformas (región {region})
        </div>
        <div className="flex gap-6 flex-wrap">
          <div>
            <div className="font-semibold text-zinc-900 dark:text-white">Streaming</div>
            <div className="text-zinc-600 dark:text-zinc-400 text-sm">
              {flatrate.length ? flatrate.map((p) => p.provider_name).join(", ") : "No disponible"}
            </div>
          </div>
          <div>
            <div className="font-semibold text-zinc-900 dark:text-white">Alquiler</div>
            <div className="text-zinc-600 dark:text-zinc-400 text-sm">
              {rent.length ? rent.map((p) => p.provider_name).join(", ") : "No disponible"}
            </div>
          </div>
          <div>
            <div className="font-semibold text-zinc-900 dark:text-white">Compra</div>
            <div className="text-zinc-600 dark:text-zinc-400 text-sm">
              {buy.length ? buy.map((p) => p.provider_name).join(", ") : "No disponible"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
