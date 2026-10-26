"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, MessageSquareText, Puzzle, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

// Las actividades (fase B) se muestran recién después de la hackatón, para no distraer el día del
// evento. Se prenden con NEXT_PUBLIC_ACTIVIDADES=1 en Vercel.
const ACTIVIDADES = process.env.NEXT_PUBLIC_ACTIVIDADES === "1";

const ITEMS = [
  { href: "/inicio", etiqueta: "Inicio", Icono: House },
  ...(ACTIVIDADES ? [{ href: "/actividades", etiqueta: "Actividades", Icono: Puzzle }] : []),
  { href: "/devolucion", etiqueta: "Devolución", Icono: MessageSquareText },
  { href: "/perfil", etiqueta: "Perfil", Icono: UserRound },
];

export function BarraEstudiante() {
  const ruta = usePathname();
  if (ruta.startsWith("/bienvenida")) return null;
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg"
    >
      <ul className={cn("mx-auto grid max-w-md", ACTIVIDADES ? "grid-cols-4" : "grid-cols-3")}>
        {ITEMS.map(({ href, etiqueta, Icono }) => {
          const activo = ruta.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11.5px] font-medium transition-colors",
                  activo ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-12 place-items-center rounded-full transition-colors duration-200",
                    activo && "bg-lila-claro text-verde-oscuro",
                  )}
                >
                  <Icono className="size-5" aria-hidden="true" />
                </span>
                {etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
