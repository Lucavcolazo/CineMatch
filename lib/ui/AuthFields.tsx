/* Componentes de formulario para Auth.
   Están en client porque necesitamos estado (mostrar/ocultar contraseña). */
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
  // Se resuelven los íconos únicamente del lado cliente.
  if (name === "mail") return <Mail size={18} />;
  if (name === "user") return <UserRound size={18} />;
  return <Lock size={18} />;
}

export function TextField(
  props: BaseFieldProps & { type: React.HTMLInputTypeAttribute; icon: IconName },
) {
  const { icon, className, ...rest } = props;
  return (
    <div className={`field ${className ?? ""}`.trim()}>
      <span className="fieldIcon" aria-hidden="true">
        {renderIcon(icon)}
      </span>
      <input className="fieldInput" {...rest} />
    </div>
  );
}

export function PasswordField(
  props: BaseFieldProps & {
    icon: IconName;
    toggleLabelShow?: string;
    toggleLabelHide?: string;
    error?: boolean;
  },
) {
  const { icon, toggleLabelShow, toggleLabelHide, className, error, ...rest } = props;
  const [visible, setVisible] = React.useState(false);
  const labelShow = toggleLabelShow ?? "Mostrar contraseña";
  const labelHide = toggleLabelHide ?? "Ocultar contraseña";

  return (
    <div className={`field ${error ? "fieldError" : ""} ${className ?? ""}`.trim()}>
      <span className="fieldIcon" aria-hidden="true">
        {renderIcon(icon)}
      </span>
      <input className="fieldInput" type={visible ? "text" : "password"} {...rest} />
      <button
        type="button"
        className="iconButton"
        aria-label={visible ? labelHide : labelShow}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

