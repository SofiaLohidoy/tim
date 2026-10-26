import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
