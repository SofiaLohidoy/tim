"use client";

import { useEffect } from "react";
import { enviarEvento, leerOrigen } from "@/lib/landing/origen";
import type { Variante } from "./variantes";

// Mide la landing en la base propia: visita, secciones vistas, clics en CTA. No usa cookies de
// terceros ni guarda la IP. La variante y el visitante los lee el servidor de las cookies.
export function Medicion({ variante }: { variante: Variante }) {
  useEffect(() => {
    const origen = leerOrigen();
    if (origen.origen === "qr") document.querySelector(".tl .hero")?.setAttribute("data-origen", "qr");
    enviarEvento("visita", `variante_${variante}`, origen);

    const vistas = new Set<string>();
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const s = (e.target as HTMLElement).dataset.seccion;
          if (e.isIntersecting && s && !vistas.has(s)) {
            vistas.add(s);
            enviarEvento("seccion", s);
          }
        }
      },
      { threshold: 0.35 },
    );
    document.querySelectorAll<HTMLElement>(".tl [data-seccion]").forEach((el) => io.observe(el));

    const alClic = (ev: MouseEvent) => {
      const cta = (ev.target as HTMLElement).closest<HTMLElement>("[data-cta]");
      if (cta?.dataset.cta) enviarEvento("clic_cta", cta.dataset.cta);
    };
    document.addEventListener("click", alClic);
    return () => {
      io.disconnect();
      document.removeEventListener("click", alClic);
    };
  }, [variante]);
  return null;
}
