import type { Metadata } from "next";
import { Suspense } from "react";
import { Brain, Grid3x3, SpellCheck } from "lucide-react";
import { exigirUsuario } from "@/lib/sesion";
import { ACTIVIDADES } from "@/lib/actividades/catalogo";
import type { Tipo } from "@/lib/actividades/tipos";

export const metadata: Metadata = { title: "Actividades" };
const ICONO: Record<Tipo, typeof Brain> = { palabra: SpellCheck, crucigrama: Grid3x3, einstein: Brain };

export default function Pagina() {
  return (
    <main className="mx-auto w-full max-w-md px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-28">
      <header>
        <p className="text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">Actividades</p>
        <h1 className="mt-1.5 text-[1.9rem] leading-tight font-extrabold">Lo que viene.</h1>
        <p className="mt-2 text-muted-foreground">Títulos tentativos de actividades en preparación.</p>
      </header>
      <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted" />}><Lista /></Suspense>
    </main>
  );
}

async function Lista() {
  await exigirUsuario("/actividades");
  return (
    <ul aria-label="Actividades próximamente" className="mt-6 grid gap-3">
      {ACTIVIDADES.map((a) => {
        const Icono = ICONO[a.tipo];
        return (
          <li key={a.slug}>
            <div aria-disabled="true" className="flex items-center gap-4 rounded-3xl bg-muted/50 p-4 ring-1 ring-border">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-lila-claro text-violeta-texto"><Icono className="size-6" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-[17px] font-bold leading-snug">{a.tituloTentativo ?? a.titulo}</h2>
                <span className="mt-2 inline-block rounded-full bg-lila-claro px-2.5 py-1 text-xs font-semibold text-violeta-texto">Próximamente</span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
