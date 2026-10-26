"use client";

import { useEffect, useRef, useState } from "react";

// Mini demo del paso 2: un mentor marca el nivel de una dimensión. Se pausa fuera de pantalla,
// con la pestaña oculta y con reduced-motion (queda fija en "Se observa con claridad").
const ESCENAS = [
  { dim: "Comprensión del problema", nivel: 2 },
  { dim: "Iniciativa y adaptación", nivel: 3 },
  { dim: "Resolución", nivel: 1 },
];
const NIVELES = ["Todavía no se observa", "Se observa a veces", "Se observa con claridad", "Se destaca"];

export function RubricaDemo() {
  const [paso, setPaso] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visible = false;
    let t: ReturnType<typeof setInterval> | null = null;
    const sync = () => {
      const correr = visible && document.visibilityState === "visible";
      if (correr && !t) t = setInterval(() => setPaso((p) => (p + 1) % ESCENAS.length), 2400);
      if (!correr && t) {
        clearInterval(t);
        t = null;
      }
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    if (ref.current) io.observe(ref.current);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      if (t) clearInterval(t);
    };
  }, []);

  const escena = ESCENAS[paso];
  return (
    <div ref={ref} className="demo-caja rubrica-demo" aria-hidden="true">
      <span className="dim">{escena.dim}</span>
      <div className="niveles">
        {NIVELES.map((n, i) => (
          <span key={n} className={i === escena.nivel ? "on" : undefined}>
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
