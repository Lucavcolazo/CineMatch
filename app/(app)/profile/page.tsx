import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updatePreferences } from "@/lib/actions/user";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login");

  const { data: prefs } = await supabase
    .from("preferences")
    .select("region, genres, providers")
    .eq("user_id", user.id)
    .maybeSingle();

  const region = (prefs?.region as string) || "AR";
  const genres = (prefs?.genres as number[]) || [];
  const providers = (prefs?.providers as number[]) || [];

  async function logout() {
    "use server";
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  return (
    <div className="container">
      <div className="card">
        <div className="title">Profile</div>
        <p className="muted">Sesión: {user.email}</p>
        <div style={{ height: 12 }} />
        <div className="row">
          <a className="button buttonSecondary" href="/profile/favorites">
            Ver favoritos
          </a>
          <form action={logout}>
            <button className="button" type="submit">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>

      <div style={{ height: 14 }} />
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Preferencias (v1)</div>
        <p className="muted" style={{ marginBottom: 10 }}>
          Esto es una edición simple por texto (v1). Más adelante lo mejoramos con selectores.
        </p>
        <form
          action={async (formData: FormData) => {
            "use server";
            const region = String(formData.get("region") ?? "AR").trim().toUpperCase() || "AR";
            const genresRaw = String(formData.get("genres") ?? "").trim();
            const providersRaw = String(formData.get("providers") ?? "").trim();

            const parseCsvInts = (s: string) =>
              s
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
                .map((x) => Number(x))
                .filter((n) => Number.isFinite(n)) as number[];

            await updatePreferences({
              region,
              genres: parseCsvInts(genresRaw),
              providers: parseCsvInts(providersRaw),
              nextPath: "/profile",
            });
          }}
          className="row"
          style={{ alignItems: "stretch" }}
        >
          <input
            className="input"
            name="region"
            placeholder="Región (ej: AR, US, ES)"
            defaultValue={region}
            style={{ width: 220 }}
          />
          <input
            className="input"
            name="genres"
            placeholder="Géneros TMDB (CSV) ej: 18,35"
            defaultValue={genres.join(",")}
            style={{ minWidth: 260 }}
          />
          <input
            className="input"
            name="providers"
            placeholder="Providers TMDB (CSV) ej: 8,119"
            defaultValue={providers.join(",")}
            style={{ minWidth: 260 }}
          />
          <button className="button" type="submit">
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
}

