"use client";

import { useRef, useEffect, useState } from "react";
import { X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Iconos de personas y objetos para elegir como avatar (nombre -> componente).
const AVATAR_ICONS: { name: string; Icon: LucideIcon }[] = [
  { name: "User", Icon: LucideIcons.User },
  { name: "UserCircle", Icon: LucideIcons.UserCircle },
  { name: "UserRound", Icon: LucideIcons.UserRound },
  { name: "Bot", Icon: LucideIcons.Bot },
  { name: "Ghost", Icon: LucideIcons.Ghost },
  { name: "Heart", Icon: LucideIcons.Heart },
  { name: "Star", Icon: LucideIcons.Star },
  { name: "Film", Icon: LucideIcons.Film },
  { name: "Tv", Icon: LucideIcons.Tv },
  { name: "Music", Icon: LucideIcons.Music },
  { name: "Camera", Icon: LucideIcons.Camera },
  { name: "Coffee", Icon: LucideIcons.Coffee },
  { name: "Gamepad2", Icon: LucideIcons.Gamepad2 },
  { name: "BookOpen", Icon: LucideIcons.BookOpen },
  { name: "Palette", Icon: LucideIcons.Palette },
  { name: "Smile", Icon: LucideIcons.Smile },
  { name: "Cat", Icon: LucideIcons.Cat },
  { name: "Dog", Icon: LucideIcons.Dog },
];

const BUBBLE_COLORS: { value: string; label: string }[] = [
  { value: "#6366f1", label: "Índigo" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#f59e0b", label: "Ámbar" },
  { value: "#10b981", label: "Esmeralda" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#8b5cf6", label: "Violeta" },
  { value: "#ef4444", label: "Rojo" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#64748b", label: "Slate" },
  { value: "#f97316", label: "Naranja" },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  currentIcon: string | null;
  currentColor: string | null;
  onSave: (icon: string, color: string) => void;
};

export function AvatarIconModal({
  isOpen,
  onClose,
  currentIcon,
  currentColor,
  onSave,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [selectedIcon, setSelectedIcon] = useState(
    () =>
      (currentIcon && AVATAR_ICONS.some((i) => i.name === currentIcon) ? currentIcon : "User")
  );
  const [selectedColor, setSelectedColor] = useState(() => currentColor || BUBBLE_COLORS[0].value);

  useEffect(() => {
    if (isOpen) {
      setSelectedIcon(
        currentIcon && AVATAR_ICONS.some((i) => i.name === currentIcon) ? currentIcon : "User"
      );
      setSelectedColor(currentColor || BUBBLE_COLORS[0].value);
    }
  }, [isOpen, currentIcon, currentColor]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSave = () => {
    onSave(selectedIcon, selectedColor);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
      aria-modal="true"
      role="dialog"
      aria-labelledby="avatar-modal-title"
    >
      <div
        ref={ref}
        className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 id="avatar-modal-title" className="text-lg font-semibold text-white">
            Elegir icono y color
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-6">
          <div>
            <p className="text-white/80 text-sm font-medium mb-3">Icono</p>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_ICONS.map(({ name, Icon }) => {
                const selected = selectedIcon === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedIcon(name)}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-colors ${
                      selected
                        ? "border-white bg-white/20 text-white"
                        : "border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                    aria-pressed={selected}
                    aria-label={name}
                  >
                    <Icon size={22} />
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-white/80 text-sm font-medium mb-3">Color de la burbuja</p>
            <div className="flex flex-wrap gap-2">
              {BUBBLE_COLORS.map((c) => {
                const selected = selectedColor === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSelectedColor(c.value)}
                    className={`w-9 h-9 rounded-full border-2 transition-transform ${
                      selected ? "border-white scale-110" : "border-white/30 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.value }}
                    aria-pressed={selected}
                    aria-label={c.label}
                  />
                );
              })}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-white/10 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm font-medium hover:bg-white/10"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export { AVATAR_ICONS, BUBBLE_COLORS };
