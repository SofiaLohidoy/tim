"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#empresas">Empresas</a>
          <a href="#hackaton">Hackatón</a>
          <a href="#preguntas">Preguntas</a>
          <Link href="/ingresar" className="nav-entrar" data-cta="nav_ingresar">
            Entrar
          </Link>
        </div>
      </div>
    </nav>
  );
}
