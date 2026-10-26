import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/sesion";
import { equiposAsignados, misEvaluaciones } from "@/lib/staff";
import { rubricaDelEvento } from "@/lib/rubrica";
import { dimensionesPara } from "@/lib/devoluciones";
import { Evaluacion } from "@/components/app/evaluacion";

export const metadata: Metadata = { title: "Evaluar" };

export default function Pagina({ params }: PageProps<"/mentor/[equipo]/[persona]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-muted" />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: PageProps<"/mentor/[equipo]/[persona]">["params"] }) {
  const { equipo: equipoId, persona } = await params;
  const u = await exigirRol("mentor", `/mentor/${equipoId}/${persona}`);
  const db = await clienteServidor();
  const equipo = (await equiposAsignados(db, u.id, "mentor")).find((e) => e.id === equipoId);
  const idx = equipo?.miembros.findIndex((m) => m.id === persona) ?? -1;
  if (!equipo || idx < 0) notFound();

  const [rubrica, evals] = await Promise.all([rubricaDelEvento(db, equipo.rubricaId), misEvaluaciones(db, u.id, [equipo.id])]);
  if (!rubrica) notFound();
  const actual = evals.get(`${equipo.id}:${persona}`);
  // Siguiente: la próxima persona que todavía no tiene la evaluación enviada.
  const siguiente = [...equipo.miembros.slice(idx + 1), ...equipo.miembros.slice(0, idx)].find(
    (m) => evals.get(`${equipo.id}:${m.id}`)?.estado !== "enviada",
  );

  return (
    <div className="grid gap-4">
      <Link href={`/mentor/${equipo.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> {equipo.nombre}
      </Link>
      <header>
        <p className="text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase tabular-nums">
          Persona {idx + 1} de {equipo.miembros.length}
        </p>
        <h1 className="mt-1 text-[1.7rem] leading-tight font-extrabold">{equipo.miembros[idx].nombre}</h1>
      </header>
      <Evaluacion
        key={persona}
        equipoId={equipo.id}
        rol="mentor"
        estudianteId={persona}
        dimensiones={dimensionesPara("mentor", rubrica.dimensiones)}
        niveles={rubrica.niveles}
        inicial={{
          respuestas: (actual?.respuestas ?? {}) as Record<string, { nivel?: string | null; obs?: string }>,
          comentario: actual?.comentario ?? "",
          estado: (actual?.estado as "borrador" | "enviada" | undefined) ?? null,
          actualizado: actual ? new Date(actual.actualizado_en).getTime() : 0,
        }}
        cerrada={equipo.publicadas}
        despues={siguiente ? `/mentor/${equipo.id}/${siguiente.id}` : `/mentor/${equipo.id}`}
        textoDespues={siguiente ? `seguir con ${siguiente.nombre.split(" ")[0]}` : "volver al equipo"}
      />
    </div>
  );
}
