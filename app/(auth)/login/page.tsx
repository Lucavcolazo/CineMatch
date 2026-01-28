import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage(props: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/discover");

  const { next } = await props.searchParams;

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Por simplicidad v1, usamos redirect con query param.
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
    redirect(next ? next : "/discover");
  }

  return (
    <div className="container">
      <div className="card">
        <div className="title">Login</div>
        <form action={login} className="row" style={{ alignItems: "stretch" }}>
          <input className="input" name="email" type="email" placeholder="Email" required />
          <input
            className="input"
            name="password"
            type="password"
            placeholder="Password"
            required
          />
          <button className="button" type="submit">
            Entrar
          </button>
        </form>
        <div style={{ height: 12 }} />
        <p className="muted">
          ¿No tenés cuenta? <Link href="/signup">Creala acá</Link>.
        </p>
      </div>
    </div>
  );
}

