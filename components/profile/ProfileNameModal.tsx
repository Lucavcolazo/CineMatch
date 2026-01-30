"use client";

import { useEffect, useRef } from "react";
import { ProfileNameForm } from "./ProfileNameForm";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialDisplayName: string;
};

export function ProfileNameModal({ isOpen, onClose, initialDisplayName }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleProfileUpdated = () => {
      onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("profile-updated", handleProfileUpdated);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("profile-updated", handleProfileUpdated);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-modal-title"
    >
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <h2 id="name-modal-title" className="text-lg font-semibold text-white mb-4">
          Cambiar nombre
        </h2>
        <ProfileNameForm initialDisplayName={initialDisplayName} />
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 rounded-lg border border-white/20 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
