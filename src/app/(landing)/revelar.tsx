"use client";

import { useEffect } from "react";

// Fade de entrada de las secciones. Sin JS la página se ve completa: el estado oculto solo
// aplica con html.js (ver landing.css), que se pone acá.
export function Revelar() {
  useEffect(() => {
    document.documentElement.classList.add("js");
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
    );
    const elementos = document.querySelectorAll(".tl .revela");
    elementos.forEach((el) => io.observe(el));
    // Red de seguridad: si el observer no dispara (scroll por ancla, pestaña en segundo plano),
    // nada queda oculto más de unos segundos.
    const t = setTimeout(() => elementos.forEach((el) => el.classList.add("in")), 2500);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);
  return null;
}
