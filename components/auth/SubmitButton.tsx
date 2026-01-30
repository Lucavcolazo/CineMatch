"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  className?: string;
  disabledClassName?: string;
  icon?: React.ReactNode;
};

/**
 * Botón de submit que se deshabilita y pone gris mientras se envía el formulario.
 * Debe estar dentro de un <form> que use una server action.
 */
export function SubmitButton({
  children,
  className = "inline-flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl border border-white/30 bg-white text-black font-medium shadow-lg transition-all hover:brightness-105 active:translate-y-px",
  disabledClassName = "disabled:opacity-60 disabled:pointer-events-none disabled:bg-zinc-400 disabled:border-zinc-500 disabled:cursor-not-allowed",
  icon,
}: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} ${disabledClassName}`}
    >
      {icon}
      {children}
    </button>
  );
}
