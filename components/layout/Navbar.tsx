"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useEffect, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      setIsAuthed(Boolean(data.user));
    };
    checkAuth();
  }, []);

  const getNavOptions = () => {
    if (pathname === "/") {
      return {
        left: null,
        right: null,
        actions: (
          <>
            <Link
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium border border-white/30 bg-white text-black hover:bg-white/90 transition-colors"
              href="/login"
            >
              Iniciar sesión
            </Link>
            <Link
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-black border border-white hover:bg-white/90 transition-colors"
              href="/signup"
            >
              Registrarse
            </Link>
          </>
        ),
      };
    }

    if (pathname.startsWith("/login")) {
      return { left: { href: "/", label: "Inicio" }, right: { href: "/signup", label: "Registrarse" }, actions: null };
    }
    if (pathname.startsWith("/signup")) {
      return { left: { href: "/", label: "Inicio" }, right: { href: "/login", label: "Iniciar sesión" }, actions: null };
    }
    if (pathname.startsWith("/forgot-password")) {
      return { left: { href: "/login", label: "Volver" }, right: null, actions: null };
    }
    if (pathname.startsWith("/reset-password")) {
      return { left: { href: "/login", label: "Volver" }, right: null, actions: null };
    }

    if (isAuthed) {
      if (pathname.startsWith("/discover")) {
        return {
          left: { href: "/", label: "Inicio" },
          right: { href: "/search", label: "Buscar" },
          actions: (
            <>
              <Link className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm border border-white/20 text-white hover:bg-white/10 transition-colors" href="/search">Buscar</Link>
              <Link className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm border border-white/20 text-white hover:bg-white/10 transition-colors" href="/profile">Perfil</Link>
            </>
          ),
        };
      }
      if (pathname.startsWith("/search")) {
        return {
          left: { href: "/discover", label: "Descubrir" },
          right: { href: "/profile", label: "Perfil" },
          actions: (
            <>
              <Link className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm border border-white/20 text-white hover:bg-white/10 transition-colors" href="/discover">Descubrir</Link>
              <Link className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm border border-white/20 text-white hover:bg-white/10 transition-colors" href="/profile">Perfil</Link>
            </>
          ),
        };
      }
      if (pathname.startsWith("/profile")) {
        return {
          left: { href: "/discover", label: "Descubrir" },
          right: { href: "/search", label: "Buscar" },
          actions: (
            <>
              <Link className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm border border-white/20 text-white hover:bg-white/10 transition-colors" href="/discover">Descubrir</Link>
              <Link className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm border border-white/20 text-white hover:bg-white/10 transition-colors" href="/search">Buscar</Link>
            </>
          ),
        };
      }
      if (pathname.startsWith("/title")) {
        return {
          left: { href: "/discover", label: "Volver" },
          right: null,
          actions: (
            <>
              <Link className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm border border-white/20 text-white hover:bg-white/10 transition-colors" href="/discover">Descubrir</Link>
              <Link className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm border border-white/20 text-white hover:bg-white/10 transition-colors" href="/search">Buscar</Link>
              <Link className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm border border-white/20 text-white hover:bg-white/10 transition-colors" href="/profile">Perfil</Link>
            </>
          ),
        };
      }
    }

    return { left: { href: "/", label: "Inicio" }, right: null, actions: null };
  };

  const options = getNavOptions();
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");
  const isLanding = pathname === "/";

  const navBg = isLanding
    ? "bg-[#1A1A1A] border-white/10"
    : isAuthPage
      ? "bg-black border-white/10"
      : "bg-white border-black/10 shadow-sm";
  const brandColor = isLanding || isAuthPage ? "text-white hover:opacity-80" : "text-black hover:opacity-70";
  const navBtnBase = "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors";
  const navBtnStyle =
    isLanding || isAuthPage
      ? "border border-white/20 text-white hover:bg-white/10"
      : "border border-black/15 text-black hover:bg-black/5";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[1000] border-b ${navBg}`}>
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className={`inline-flex items-center gap-2 font-bold text-lg tracking-tight ${brandColor} transition-opacity`}>
            <Home size={20} aria-hidden="true" />
            <span>CineMatch</span>
          </Link>
          {options.left ? (
            <Link href={options.left.href} className={`${navBtnBase} ${navBtnStyle}`}>
              <ArrowLeft size={18} aria-hidden="true" />
              <span>{options.left.label}</span>
            </Link>
          ) : null}
        </div>

        {options.right ? (
          <Link href={options.right.href} className={`${navBtnBase} ${navBtnStyle}`}>
            <span>{options.right.label}</span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        ) : options.actions ? (
          <div className="flex items-center gap-2.5">{options.actions}</div>
        ) : null}
      </div>
    </nav>
  );
}
