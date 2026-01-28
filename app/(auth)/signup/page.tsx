import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SignupPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/discover");

  async function signup(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const displayName = String(formData.get("display_name") ?? "").trim();

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);
    redirect("/discover");
  }

  return (
    <div className="container">
      <div className="card">
        <div className="title">Signup</div>
        <form action={signup} className="row" style={{ alignItems: "stretch" }}>
          <input
            className="input"
            name="display_name"
            type="text"
            placeholder="Nombre (opcional)"
          />
          <input className="input" name="email" type="email" placeholder="Email" required />
          <input
            className="input"
            name="password"
            type="password"
            placeholder="Password"
            required
          />
          <button className="button" type="submit">
            Crear cuenta
          </button>
        </form>
        <div style={{ height: 12 }} />
        <p className="muted">
          ¿Ya tenés cuenta? <Link href="/login">Entrá acá</Link>.
        </p>
      </div>
    </div>
  );
}

