import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/sesion";
import { equiposAsignados, misEvaluaciones } from "@/lib/staff";
import { EstadoChip } from "@/components/app/estado-chip";

export const metadata: Metadata = { title: "Jurado" };

export default function Pagina() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-3xl bg-muted" />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  const u = await exigirRol("jurado", "/jurado");
  const db = await clienteServidor();
  const equipos = await equiposAsignados(db, u.id, "jurado");
  const evals = await misEvaluaciones(db, u.id, equipos.map((e) => e.id));

  return (
    <div className="grid gap-4">
      <header>
        <p className="text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">Jurado</p>
        <h1 className="mt-1 text-[1.7rem] leading-tight font-extrabold">Hola, {u.nombre ?? "jurado"}</h1>
        <p className="mt-1 text-muted-foreground">Evaluá la entrega y el pitch de cada equipo con la rúbrica.</p>
      </header>
      {equipos.length === 0 ? (
        <div className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <p className="font-heading text-lg font-bold">Todavía no tenés equipos asignados.</p>
          <p className="mt-1 text-muted-foreground">El equipo TIM te los asigna antes de las presentaciones.</p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-3xl bg-card ring-1 ring-border">
          {equipos.map((e) => (
            <li key={e.id} className="border-b border-border last:border-0">
              <Link href={`/jurado/${e.id}`} className="flex min-h-16 items-center gap-3 px-5 py-3">
                <span className="flex-1">
                  <span className="block font-heading text-lg font-bold">{e.nombre}</span>
                  <span className="text-sm text-muted-foreground">{e.miembros.length} integrantes</span>
                </span>
                <EstadoChip estado={evals.get(`${e.id}:equipo`)?.estado as "borrador" | "enviada" | undefined} />
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
              {e.archivoNombre && <a href={`/entregas/${e.id}`} target="_blank" rel="noreferrer" className="mx-5 mb-3 inline-flex min-h-11 items-center gap-2 font-semibold text-violeta-texto"><ExternalLink className="size-4" aria-hidden="true" />Ver archivo<span className="sr-only"> de {e.nombre}</span></a>}
              {e.entregaUrl && <a href={e.entregaUrl} target="_blank" rel="noreferrer" className="mx-5 mb-3 inline-flex min-h-11 items-center gap-2 font-semibold text-violeta-texto"><ExternalLink className="size-4" aria-hidden="true" />Ver entrega<span className="sr-only"> de {e.nombre}</span></a>}
              {!e.entregaUrl && !e.archivoNombre && <p className="px-5 pb-3 text-sm text-muted-foreground">Sin entrega</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
