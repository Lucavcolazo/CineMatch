"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { GoogleIcon } from "./GoogleIcon";
import { useState } from "react";

export function IngresaActions() {
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      setGoogleLoading(false);
    }
  }

  const btnClass =
    "inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-white/30 bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-60";

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={googleLoading}
      className={btnClass}
    >
      <GoogleIcon size={18} className="text-white" />
      {googleLoading ? "Redirigiendo…" : "Ingresar con Google"}
    </button>
  );
}
