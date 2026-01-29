"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useEffect, useState } from "react";

// Navbar reutilizable que siempre está arriba con botones de navegación
export function Navbar() {
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const checkAuth = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      setIsAuthed(Boolean(data.user));
    };
    checkAuth();
  }, []);

  // Determinar las opciones según la página actual
  const getNavOptions = () => {
    // Página principal (landing)
    if (pathname === "/") {
      return {
        left: null,
        right: null,
        actions: (
          <>
            <Link className="navbarBtn navbarBtnSecondary" href="/login">
              Iniciar sesión
            </Link>
            <Link className="navbarBtn navbarBtnPrimary" href="/signup">
              Registrarse
            </Link>
          </>
        ),
      };
    }

    // Páginas de autenticación
    if (pathname.startsWith("/login")) {
      return {
        left: { href: "/", label: "Inicio" },
        right: { href: "/signup", label: "Registrarse" },
        actions: null,
      };
    }

    if (pathname.startsWith("/signup")) {
      return {
        left: { href: "/", label: "Inicio" },
        right: { href: "/login", label: "Iniciar sesión" },
        actions: null,
      };
    }

    if (pathname.startsWith("/forgot-password")) {
      return {
        left: { href: "/login", label: "Volver" },
        right: null,
        actions: null,
      };
    }

    if (pathname.startsWith("/reset-password")) {
      return {
        left: { href: "/login", label: "Volver" },
        right: null,
        actions: null,
      };
    }

    // Páginas privadas (requieren autenticación)
    if (isAuthed) {
      if (pathname.startsWith("/discover")) {
        return {
          left: { href: "/", label: "Inicio" },
          right: { href: "/search", label: "Buscar" },
          actions: (
            <>
              <Link className="navbarBtn navbarBtnSecondary" href="/search">
                Buscar
              </Link>
              <Link className="navbarBtn navbarBtnSecondary" href="/profile">
                Perfil
              </Link>
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
              <Link className="navbarBtn navbarBtnSecondary" href="/discover">
                Descubrir
              </Link>
              <Link className="navbarBtn navbarBtnSecondary" href="/profile">
                Perfil
              </Link>
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
              <Link className="navbarBtn navbarBtnSecondary" href="/discover">
                Descubrir
              </Link>
              <Link className="navbarBtn navbarBtnSecondary" href="/search">
                Buscar
              </Link>
            </>
          ),
        };
      }

      // Para páginas de título individual
      if (pathname.startsWith("/title")) {
        return {
          left: { href: "/discover", label: "Volver" },
          right: null,
          actions: (
            <>
              <Link className="navbarBtn navbarBtnSecondary" href="/discover">
                Descubrir
              </Link>
              <Link className="navbarBtn navbarBtnSecondary" href="/search">
                Buscar
              </Link>
              <Link className="navbarBtn navbarBtnSecondary" href="/profile">
                Perfil
              </Link>
            </>
          ),
        };
      }
    }

    // Default: solo botón de inicio
    return {
      left: { href: "/", label: "Inicio" },
      right: null,
      actions: null,
    };
  };

  const options = getNavOptions();
  
  // Detectar si estamos en una página de autenticación
  const isAuthPage = pathname.startsWith("/login") || 
                     pathname.startsWith("/signup") || 
                     pathname.startsWith("/forgot-password") || 
                     pathname.startsWith("/reset-password");

  return (
    <nav className={`navbar ${isAuthPage ? "navbarAuth" : ""}`}>
      <div className="navbarContent">
        {/* Botón izquierdo con flecha */}
        {options.left && (
          <Link href={options.left.href} className="navbarNavBtn navbarNavBtnLeft">
            <ArrowLeft size={18} aria-hidden="true" />
            <span>{options.left.label}</span>
          </Link>
        )}

        {/* Logo/Brand centrado */}
        <Link href="/" className="navbarBrand">
          <Home size={20} aria-hidden="true" />
          <span>CineMatch</span>
        </Link>

        {/* Botón derecho con flecha */}
        {options.right && (
          <Link href={options.right.href} className="navbarNavBtn navbarNavBtnRight">
            <span>{options.right.label}</span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        )}

        {/* Acciones (botones de la derecha) */}
        {options.actions && <div className="navbarActions">{options.actions}</div>}
      </div>
    </nav>
  );
}
