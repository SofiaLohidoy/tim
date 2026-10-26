import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/sesion";
import { equiposAsignados, misEvaluaciones } from "@/lib/staff";
import { EstadoChip } from "@/components/app/estado-chip";

export const metadata: Metadata = { title: "Tu equipo" };

export default function Pagina({ params }: PageProps<"/mentor/[equipo]">) {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-3xl bg-muted" />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: PageProps<"/mentor/[equipo]">["params"] }) {
  const { equipo: id } = await params;
  const u = await exigirRol("mentor", `/mentor/${id}`);
  const db = await clienteServidor();
  const equipo = (await equiposAsignados(db, u.id, "mentor")).find((e) => e.id === id);
  if (!equipo) notFound();
  const evals = await misEvaluaciones(db, u.id, [equipo.id]);

  return (
    <div className="grid gap-4">
      <Link href="/mentor" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Mis equipos
      </Link>
      <header>
        <h1 className="text-[1.7rem] leading-tight font-extrabold">{equipo.nombre}</h1>
        <p className="mt-1 text-muted-foreground">Tocá una persona para evaluarla.</p>
      </header>
      {equipo.miembros.length === 0 ? (
        <p className="rounded-3xl bg-card p-5 text-muted-foreground ring-1 ring-border">
          El equipo todavía no tiene integrantes. Aparecen cuando el equipo TIM los asigna.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-3xl bg-card ring-1 ring-border">
          {equipo.miembros.map((m) => (
            <li key={m.id} className="border-b border-border last:border-0">
              <Link href={`/mentor/${equipo.id}/${m.id}`} className="flex min-h-16 items-center gap-3 px-5 py-3">
                <span className="grid size-10 place-items-center rounded-full bg-lila-claro font-bold text-verde-oscuro">
                  {m.nombre.slice(0, 1).toUpperCase()}
                </span>
                <span className="flex-1 font-semibold">{m.nombre}</span>
                <EstadoChip estado={evals.get(`${equipo.id}:${m.id}`)?.estado as "borrador" | "enviada" | undefined} />
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
