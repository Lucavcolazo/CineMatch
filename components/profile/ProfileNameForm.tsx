"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/actions/user";
import { cacheRemove, PROFILE_CACHE_KEY } from "@/lib/cache";

type Props = {
  initialDisplayName: string;
};

export function ProfileNameForm({ initialDisplayName }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = String((form.elements.namedItem("display_name") as HTMLInputElement)?.value ?? "").trim();
    setSaving(true);
    try {
      await updateProfile({ display_name: name || undefined });
      cacheRemove(PROFILE_CACHE_KEY);
      window.dispatchEvent(new CustomEvent("profile-updated"));
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label htmlFor="display_name" className="block text-white/80 text-sm font-medium">
        Nombre
      </label>
      <input
        id="display_name"
        name="display_name"
        type="text"
        defaultValue={initialDisplayName}
        placeholder="Tu nombre"
        className="w-full max-w-md rounded-lg border border-white/20 bg-white/5 text-white px-3 py-2 text-sm placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/30"
      />
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        {saving ? "Guardando…" : "Guardar nombre"}
      </button>
    </form>
  );
}
