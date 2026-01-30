"use client";

import { ArrowRight } from "lucide-react";
import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * Input minimalista para el chat: textarea + botón enviar (solo icono).
 * Enter envía; Shift+Enter nueva línea.
 */
export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Escribí tu mensaje...",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 300)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSubmit();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-2xl mx-auto gap-2 rounded-2xl bg-white/5 border border-white/10 p-2"
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 min-h-[44px] max-h-[300px] resize-none rounded-xl border-none bg-transparent px-4 py-3 text-white placeholder:text-white/50",
          "focus:outline-none focus:ring-0"
        )}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Enviar mensaje"
        className={cn(
          "flex-shrink-0 rounded-xl p-2.5 transition-colors",
          "bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed",
          "text-white"
        )}
      >
        <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </form>
  );
}
