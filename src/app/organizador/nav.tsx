"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarDays, ClipboardList, Download, Globe, LayoutDashboard, Menu, MessageSquareText, QrCode, ScrollText, UserRound, Users, UsersRound, X } from "lucide-react";
import { Logo } from "@/components/marca";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const GRUPOS = [
  { nombre: "Evento", secciones: [
    { href: "/organizador", texto: "Tablero", icono: LayoutDashboard },
    { href: "/organizador/evento", texto: "Evento", icono: CalendarDays },
    { href: "/organizador/equipos", texto: "Equipos", icono: UsersRound },
    { href: "/organizador/personas", texto: "Personas", icono: Users },
    { href: "/organizador/devoluciones", texto: "Devoluciones", icono: MessageSquareText },
  ] },
  { nombre: "Materiales", secciones: [
    { href: "/organizador/qr", texto: "QR de asistencia", icono: QrCode },
    { href: "/organizador/cartel", texto: "Cartel de la puerta", icono: ScrollText },
    { href: "/organizador/imprimir", texto: "Rúbrica en papel", icono: ClipboardList },
  ] },
  { nombre: "Difusión y datos", secciones: [
    { href: "/organizador/landing", texto: "Landing", icono: Globe },
    { href: "/organizador/exportar", texto: "Exportar", icono: Download },
  ] },
];

function ContenidoMenu({ ruta, cerrar }: { ruta: string; cerrar?: () => void }) {
  return (
    <>
      <Link href="/organizador" onClick={cerrar} className="flex min-h-20 shrink-0 items-center gap-3 px-6 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-lila" aria-label="Panel de organización">
        <Logo className="h-7 w-auto" />
        <span className="text-xs font-semibold text-primary-foreground/70">Organización</span>
      </Link>
      <nav aria-label="Secciones" className="min-h-0 flex-1 overflow-y-auto px-3 pb-5">
        {GRUPOS.map((grupo) => (
          <div key={grupo.nombre} className="mb-5 last:mb-0">
            <p className="mb-2 px-3 text-[11px] font-semibold tracking-widest text-primary-foreground/60 uppercase">{grupo.nombre}</p>
            <ul className="space-y-1">
              {grupo.secciones.map(({ href, texto, icono: Icono }) => {
                const activo = href === "/organizador" ? ruta === href : ruta === href || ruta.startsWith(`${href}/`);
                return (
                  <li key={href}>
                    <Link href={href} onClick={cerrar} aria-current={activo ? "page" : undefined}
                      className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lila", activo ? "bg-lila text-verde-oscuro" : "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground")}>
                      <Icono className="size-[18px] shrink-0" aria-hidden="true" />
                      <span>{texto}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-primary-foreground/15 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Link href="/perfil" onClick={cerrar} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-lila">
          <UserRound className="size-[18px]" aria-hidden="true" /> Mi perfil
        </Link>
      </div>
    </>
  );
}

export function NavOrganizador() {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const actual = GRUPOS.flatMap((g) => g.secciones).find((s) => s.href === "/organizador" ? ruta === s.href : ruta === s.href || ruta.startsWith(`${s.href}/`));

  return (
    <>
      <a href="#contenido-organizador" className="sr-only fixed top-3 left-3 z-[60] rounded-lg bg-background px-4 py-3 text-foreground focus:not-sr-only">Ir al contenido</a>
      <aside aria-label="Organización" className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-primary pt-[env(safe-area-inset-top)] text-primary-foreground lg:flex print:hidden">
        <ContenidoMenu ruta={ruta} />
      </aside>
      <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 bg-primary px-4 pt-[env(safe-area-inset-top)] text-primary-foreground lg:hidden print:hidden">
        <Sheet open={abierto} onOpenChange={setAbierto}>
          <SheetTrigger aria-label="Abrir menú de organización" className="flex size-11 shrink-0 items-center justify-center rounded-xl hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-lila">
            <Menu className="size-5" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="left" showCloseButton={false} aria-describedby={undefined} className="gap-0 border-0 bg-primary pt-[env(safe-area-inset-top)] text-primary-foreground data-[side=left]:w-[min(20rem,calc(100vw-2rem))] motion-reduce:transition-none">
            <SheetTitle className="sr-only">Menú de organización</SheetTitle>
            <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar menú" className="absolute top-[max(1rem,env(safe-area-inset-top))] right-2 flex size-11 items-center justify-center rounded-xl hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-lila">
              <X className="size-5" aria-hidden="true" />
            </button>
            <ContenidoMenu ruta={ruta} cerrar={() => setAbierto(false)} />
          </SheetContent>
        </Sheet>
        <Link href="/organizador" aria-label="Panel de organización"><Logo className="h-6 w-auto" /></Link>
        <span className="ml-auto truncate text-sm font-semibold text-primary-foreground/80">{actual?.texto ?? "Organización"}</span>
      </header>
    </>
  );
}
