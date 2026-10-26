"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { Logo } from "@/components/marca";

export function NavLanding() {
  const [solida, setSolida] = useState(false);

  useEffect(() => {
    const alScrollear = () => setSolida(window.scrollY > 24);
    alScrollear();
    window.addEventListener("scroll", alScrollear, { passive: true });
    return () => window.removeEventListener("scroll", alScrollear);
  }, []);

  return (
    <nav className={`nav${solida ? " solida" : ""}`} aria-label="Principal">
      <div className="wrap nav-in">
        <Link href="/" aria-label="TIM, inicio">
          <Logo className="logo" />
        </Link>
        <div className="nav-links">
          <Link href="/estudiantes">Estudiantes</Link>
          <Link href="/empresas">Empresas</Link>
          <Link href="/ingresar?modo=entrar" className="nav-entrar" data-cta="nav_ingresar">
            <LogIn className="size-4" aria-hidden="true" />
            Entrar
          </Link>
        </div>
      </div>
    </nav>
  );
}
