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
import { VerEntregas } from "@/components/app/ver-entregas";
import { Evaluacion } from "@/components/app/evaluacion";

export const metadata: Metadata = { title: "Evaluar equipo" };

export default function Pagina({ params }: PageProps<"/jurado/[equipo]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-muted" />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: PageProps<"/jurado/[equipo]">["params"] }) {
  const { equipo: id } = await params;
  const u = await exigirRol("jurado", `/jurado/${id}`);
  const db = await clienteServidor();
  const equipos = await equiposAsignados(db, u.id, "jurado");
  const idx = equipos.findIndex((e) => e.id === id);
  if (idx < 0) notFound();
  const equipo = equipos[idx];
  const [rubrica, evals] = await Promise.all([rubricaDelEvento(db, equipo.rubricaId), misEvaluaciones(db, u.id, equipos.map((e) => e.id))]);
  if (!rubrica) notFound();
  const actual = evals.get(`${equipo.id}:equipo`);
  const siguiente = [...equipos.slice(idx + 1), ...equipos.slice(0, idx)].find((e) => evals.get(`${e.id}:equipo`)?.estado !== "enviada");

  return (
    <div className="grid gap-4">
      <Link href="/jurado" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Equipos
      </Link>
      <header>
        <h1 className="text-[1.7rem] leading-tight font-extrabold">{equipo.nombre}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{equipo.miembros.map((m) => m.nombre).join(" · ")}</p>
        <VerEntregas equipo={equipo.id} nombre={equipo.nombre} empresa={equipo.empresaElegida} documento={equipo.archivoNombre} presentacion={equipo.presentacionNombre} enlace={equipo.entregaUrl}/>
      </header>
      <Evaluacion
        key={equipo.id}
        equipoId={equipo.id}
        rol="jurado"
        estudianteId={null}
        dimensiones={dimensionesPara("jurado", rubrica.dimensiones)}
        niveles={rubrica.niveles}
        inicial={{
          respuestas: (actual?.respuestas ?? {}) as Record<string, { nivel?: string | null; obs?: string }>,
          comentario: actual?.comentario ?? "",
          estado: (actual?.estado as "borrador" | "enviada" | undefined) ?? null,
          actualizado: actual ? new Date(actual.actualizado_en).getTime() : 0,
        }}
        cerrada={equipo.publicadas}
        despues={siguiente ? `/jurado/${siguiente.id}` : "/jurado"}
        textoDespues={siguiente ? `seguir con ${siguiente.nombre}` : "volver a la lista"}
      />
    </div>
  );
}
