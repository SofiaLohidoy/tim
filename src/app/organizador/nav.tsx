"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECCIONES = [
  { href: "/organizador", texto: "Tablero" },
  { href: "/organizador/evento", texto: "Evento" },
  { href: "/organizador/equipos", texto: "Equipos" },
  { href: "/organizador/personas", texto: "Personas" },
  { href: "/organizador/qr", texto: "QR de asistencia" },
  { href: "/organizador/cartel", texto: "Cartel de la puerta" },
  { href: "/organizador/devoluciones", texto: "Devoluciones" },
  { href: "/organizador/imprimir", texto: "Rúbrica en papel" },
  { href: "/organizador/landing", texto: "Landing" },
  { href: "/organizador/exportar", texto: "Exportar" },
];

export function NavOrganizador() {
  const ruta = usePathname();
  return (
    <nav aria-label="Secciones" className="mx-auto max-w-6xl overflow-x-auto px-3 [scrollbar-width:none]">
      <ul className="flex gap-1 pb-2">
        {SECCIONES.map((s) => {
          const activo = s.href === "/organizador" ? ruta === s.href : ruta.startsWith(s.href);
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "block rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors",
                  activo ? "bg-lila text-verde-oscuro" : "text-primary-foreground/75 hover:bg-white/10 hover:text-primary-foreground",
                )}
              >
                {s.texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
