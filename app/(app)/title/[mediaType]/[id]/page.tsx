import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getTitleDetails,
  getWatchProviders,
  type MediaType,
  type TmdbProvider,
} from "@/lib/tmdb";
import { Nav } from "@/lib/ui/Nav";
import { toggleFavorite, upsertRating } from "@/lib/actions/user";

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
  const isAuthed = Boolean(user);

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
    <div className="container">
      <Nav isAuthed={isAuthed} />
      <div className="card">
        <div className="title">{details.title ?? details.name ?? "Detalle"}</div>
        <p className="muted">{details.overview || "Sin descripción."}</p>
        <div style={{ height: 12 }} />
        <div className="row">
          <Link className="button buttonSecondary" href="/search">
            Volver a Search
          </Link>
          {link ? (
            <a className="button" href={link} target="_blank" rel="noreferrer">
              Ver en TMDB
            </a>
          ) : null}
        </div>

        {user ? (
          <>
            <div style={{ height: 14 }} />
            <div className="row">
              <form
                action={async () => {
                  "use server";
                  await toggleFavorite({
                    tmdbId,
                    mediaType,
                    nextPath: `/title/${mediaType}/${tmdbId}`,
                  });
                }}
              >
                <button className="button" type="submit">
                  {fav?.id ? "Quitar de favoritos" : "Agregar a favoritos"}
                </button>
              </form>

              <form
                action={async (formData: FormData) => {
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
                }}
                className="row"
              >
                <input
                  className="input"
                  name="rating"
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  defaultValue={ratingRow?.rating ?? ""}
                  placeholder="Rating (1-10)"
                  style={{ width: 180 }}
                />
                <button className="button buttonSecondary" type="submit">
                  Guardar rating
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <div style={{ height: 14 }} />
            <p className="muted">
              Para guardar favoritos/ratings, <Link href="/login">iniciá sesión</Link>.
            </p>
          </>
        )}
      </div>

      <div style={{ height: 14 }} />
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          Plataformas (región {region})
        </div>
        <div className="row">
          <div>
            <div style={{ fontWeight: 600 }}>Streaming</div>
            <div className="muted">
              {flatrate.length ? flatrate.map((p) => p.provider_name).join(", ") : "No disponible"}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>Alquiler</div>
            <div className="muted">
              {rent.length ? rent.map((p) => p.provider_name).join(", ") : "No disponible"}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>Compra</div>
            <div className="muted">
              {buy.length ? buy.map((p) => p.provider_name).join(", ") : "No disponible"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

