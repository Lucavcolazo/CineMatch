import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TextField } from "@/lib/ui/AuthFields";
import { ArrowLeft, Send } from "lucide-react";

export default async function ForgotPasswordPage(props: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await props.searchParams;

  async function sendReset(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();

    const supabase = await createSupabaseServerClient();

    // Si tenemos origin, configuramos a dónde redirige el link del email.
    const origin = headers().get("origin");
    const redirectTo = origin ? `${origin}/reset-password` : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
    }

    // Mensaje genérico (buena práctica para no filtrar si el email existe o no).
    redirect(
      `/forgot-password?success=${encodeURIComponent(
        "Si el email existe, te enviamos un enlace para recuperar tu contraseña.",
      )}`,
    );
  }

  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authHeader">
          <div className="authTitle">Recuperar contraseña</div>
          <div className="authSubtitle">
            Te enviamos un enlace para que puedas elegir una nueva contraseña.
          </div>
        </div>

        {error ? <div className="notice noticeError">{error}</div> : null}
        {success ? <div className="notice noticeSuccess">{success}</div> : null}

        <form action={sendReset} className="form">
          <TextField
            name="email"
            type="email"
            placeholder="Tu email"
            required
            autoComplete="email"
            icon="mail"
          />
          <button className="buttonPrimary" type="submit">
            <Send size={18} aria-hidden="true" />
            Enviar enlace
          </button>
        </form>

        <div style={{ height: 14 }} />
        <p className="muted">
          <Link className="link" href="/login">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <ArrowLeft size={16} aria-hidden="true" />
              Volver al login
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}

