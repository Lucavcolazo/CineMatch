"use client";

import * as React from "react";
import { Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";

type BaseFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "children" | "className"
> & {
  className?: string;
};

type IconName = "mail" | "user" | "lock";

function renderIcon(name: IconName) {
  if (name === "mail") return <Mail size={18} />;
  if (name === "user") return <UserRound size={18} />;
  return <Lock size={18} />;
}

export function TextField(
  props: BaseFieldProps & { type: React.HTMLInputTypeAttribute; icon: IconName }
) {
  const { icon, className, ...rest } = props;
  return (
    <div className={`relative w-full ${className ?? ""}`.trim()}>
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none"
        aria-hidden="true"
      >
        {renderIcon(icon)}
      </span>
      <input
        className="w-full py-3 pl-10 pr-3 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-white/50 outline-none transition-all focus:border-white/60 focus:ring-4 focus:ring-white/20 focus:bg-white/15"
        {...rest}
      />
    </div>
  );
}

export function PasswordField(
  props: BaseFieldProps & {
    icon: IconName;
    toggleLabelShow?: string;
    toggleLabelHide?: string;
    error?: boolean;
  }
) {
  const {
    icon,
    toggleLabelShow,
    toggleLabelHide,
    className,
    error,
    ...rest
  } = props;
  const [visible, setVisible] = React.useState(false);
  const labelShow = toggleLabelShow ?? "Mostrar contraseña";
  const labelHide = toggleLabelHide ?? "Ocultar contraseña";

  return (
    <div
      className={`relative w-full ${error ? "field-error" : ""} ${className ?? ""}`.trim()}
    >
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none"
        aria-hidden="true"
      >
        {renderIcon(icon)}
      </span>
      <input
        type={visible ? "text" : "password"}
        className={`w-full py-3 pl-10 pr-12 rounded-xl border bg-white/10 text-white placeholder:text-white/50 outline-none transition-all focus:border-white/60 focus:ring-4 focus:ring-white/20 focus:bg-white/15 ${
          error ? "border-red-500/90" : "border-white/30"
        }`}
        {...rest}
      />
      <button
        type="button"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg border border-transparent bg-transparent text-white/70 hover:text-white hover:bg-white/20 hover:border-white/30 transition-colors"
        aria-label={visible ? labelHide : labelShow}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
