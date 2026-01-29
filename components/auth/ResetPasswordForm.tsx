"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PasswordField } from "@/components/auth/AuthFields";
import { Save } from "lucide-react";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const form = new FormData(e.currentTarget);
      const password = String(form.get("password") ?? "");
      const confirm = String(form.get("confirm_password") ?? "");
      if (password !== confirm) {
        setError("Las contraseñas no coinciden.");
        return;
      }
      if (!PASSWORD_REGEX.test(password)) {
        setError(
          "La contraseña debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas y números."
        );
        return;
      }
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(err.message);
        return;
      }
      router.push(
        `/login?success=${encodeURIComponent("Contraseña actualizada. Ya podés iniciar sesión.")}`
      );
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {error ? (
        <div className="rounded-xl border border-white/40 bg-white/15 text-white px-3 py-2.5 text-sm mb-3">
          {error}
        </div>
      ) : null}
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <PasswordField
          name="password"
          placeholder="Nueva contraseña"
          required
          autoComplete="new-password"
          icon="lock"
          pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"
          title="Mínimo 8 caracteres e incluir mayúsculas, minúsculas y números."
          minLength={8}
        />
        <PasswordField
          name="confirm_password"
          placeholder="Repetir nueva contraseña"
          required
          autoComplete="new-password"
          icon="lock"
          minLength={8}
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl border border-white/30 bg-white text-black font-medium shadow-lg transition-all hover:brightness-105 active:translate-y-px disabled:opacity-70"
        >
          <Save size={18} aria-hidden="true" />
          {pending ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </>
  );
}
