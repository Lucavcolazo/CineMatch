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
    const scrollHeight = el.scrollHeight;
    el.style.height = `${Math.min(scrollHeight, 300)}px`;
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
      className={cn(
        "flex w-full max-w-3xl mx-auto items-end gap-2 rounded-[28px] bg-[#1e1e1e] border-none p-3 transition-colors focus-within:bg-[#2a2a2a]",
      )}
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
          "flex-1 min-h-[24px] max-h-[300px] resize-none border-none bg-transparent px-2 py-2 text-white placeholder:text-zinc-400 text-lg",
          "focus:outline-none focus:ring-0"
        )}
        style={{ overflow: 'hidden' }} 
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Enviar mensaje"
        className={cn(
          "flex-shrink-0 rounded-full p-2 mb-0.5 transition-colors", // mb-0.5 to align with text
          "text-white/80 hover:text-white hover:bg-white/10",
          "disabled:opacity-30 disabled:cursor-not-allowed"
        )}
      >
        <ArrowRight className="h-6 w-6" strokeWidth={2} />
      </button>
    </form>
  );
}
