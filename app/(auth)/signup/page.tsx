import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignupForm } from "@/lib/ui/SignupForm";
import { UserPlus } from "lucide-react";

export default async function SignupPage(props: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/discover");

  const { error, success } = await props.searchParams;

  async function signup(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const displayName = String(formData.get("display_name") ?? "").trim();
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    if (!displayName) {
      redirect(
        `/signup?error=${encodeURIComponent(
          "El nombre de usuario es obligatorio.",
        )}`,
      );
    }

    if (password !== confirmPassword) {
      redirect(
        `/signup?error=${encodeURIComponent("Las contraseñas no coinciden.")}`,
      );
    }

    // Validación mínima server-side: 8+ caracteres, mayúscula, minúscula y número.
    const passwordOk = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
    if (!passwordOk) {
      redirect(
        `/signup?error=${encodeURIComponent(
          "La contraseña debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas y números.",
        )}`,
      );
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);

    // Si tu proyecto requiere confirmación por email, mostramos una pantalla dedicada.
    redirect(`/signup/confirm?email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authHeader">
          <div className="authTitle">Crear cuenta</div>
        </div>

        {error ? <div className="notice noticeError">{error}</div> : null}
        {success ? <div className="notice noticeSuccess">{success}</div> : null}

        <SignupForm signupAction={signup} />

        <button className="buttonPrimary" formAction={signup} type="submit">
          <UserPlus size={18} aria-hidden="true" />
          Crear cuenta
        </button>

        <div style={{ height: 14 }} />
        <p className="muted">
          ¿Ya tenés cuenta?{" "}
          <Link className="link" href="/login">
            Entrá acá
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

