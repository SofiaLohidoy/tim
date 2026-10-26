import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/sesion";
import { eventoActual, fechaLarga } from "@/lib/eventos";
import { completitud, estadoDelEvento } from "@/lib/organizador";
import { Barra, Cifra, Panel, Titulo, Vacio } from "@/components/org/ui";
import { AutoRefrescar } from "@/components/org/auto-refrescar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tablero" };

export default function Pagina() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-muted" />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  await exigirRol("organizador", "/organizador");
  const db = await clienteServidor();
  const evento = await eventoActual(db);
  if (!evento) {
    return (
      <>
        <Titulo ojo="Tablero">Todavía no hay un evento</Titulo>
        <Panel>
          <p className="text-muted-foreground">Creá el evento de la hackatón para empezar a cargar equipos y staff.</p>
          <Link href="/organizador/evento" className={cn(buttonVariants(), "mt-4 h-11 rounded-xl px-4")}>
            Crear el evento
          </Link>
        </Panel>
      </>
    );
  }

  const e = await estadoDelEvento(db, evento.id);
  const c = completitud(e);
  const enEquipos = new Set(e.miembros.map((m) => m.usuario_id));
  const presentes = new Set(e.asistencias.map((a) => a.usuario_id));
  const inscriptos = e.estudiantes.length;
  const publicadas = e.devoluciones.filter((d) => d.publicada_en).length;
  const abiertas = e.devoluciones.filter((d) => d.abierta_en).length;

  return (
    <>
      <Titulo ojo={`${evento.nombre} · ${fechaLarga(evento.fecha)}`} accion={<AutoRefrescar />}>
        Tablero
      </Titulo>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra tono="verde" valor={presentes.size} etiqueta="Asistencia" detalle={`de ${inscriptos} inscriptos${inscriptos ? ` · ${Math.round((presentes.size / inscriptos) * 100)} %` : ""}`} />
        <Cifra valor={`${c.porcentaje} %`} etiqueta="Evaluaciones enviadas" detalle={`${c.enviadas} de ${c.esperadas} esperadas`} />
        <Cifra valor={e.equipos.length} etiqueta="Equipos" detalle={`${enEquipos.size} estudiantes asignados`} />
        <Cifra valor={publicadas} etiqueta="Devoluciones publicadas" detalle={publicadas ? `${abiertas} abiertas · ${e.encuestas.length} encuestas` : "Todavía sin publicar"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel titulo="Evaluaciones por evaluador" descripcion="Personas por mentor, equipos por jurado.">
          {c.filas.length === 0 ? (
            <Vacio>Todavía no hay mentores ni jurados asignados a equipos.</Vacio>
          ) : (
            <ul className="grid gap-3">
              {c.filas
                .sort((a, b) => a.enviadas / (a.esperadas || 1) - b.enviadas / (b.esperadas || 1))
                .map((f) => (
                  <li key={`${f.evaluadorId}:${f.rol}`} className="grid gap-1.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span>
                        <span className="font-semibold">{e.persona.get(f.evaluadorId)?.nombre ?? "Sin nombre"}</span>{" "}
                        <span className="text-muted-foreground">
                          {f.rol} · {f.equipos.join(", ")}
                        </span>
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {f.enviadas}/{f.esperadas}
                        {f.borradores > 0 && ` · ${f.borradores} en borrador`}
                      </span>
                    </div>
                    <Barra valor={f.enviadas} total={f.esperadas} />
                  </li>
                ))}
            </ul>
          )}
        </Panel>

        <Panel titulo="Equipos" descripcion="Presentes sobre integrantes.">
          {e.equipos.length === 0 ? (
            <Vacio>
              Sin equipos. <Link href="/organizador/equipos" className="font-semibold text-violeta-texto underline">Crealos acá</Link>.
            </Vacio>
          ) : (
            <ul className="grid gap-2">
              {e.equipos.map((q) => {
                const integrantes = e.miembros.filter((m) => m.equipo_id === q.id);
                const aca = integrantes.filter((m) => presentes.has(m.usuario_id)).length;
                const mentor = e.asignaciones.find((a) => a.equipo_id === q.id && a.rol === "mentor");
                return (
                  <li key={q.id} className="flex items-center justify-between gap-3 rounded-2xl bg-muted px-4 py-2.5 text-sm">
                    <span className="font-semibold">{q.nombre}</span>
                    <span className="truncate text-muted-foreground">{mentor ? e.persona.get(mentor.evaluador_id)?.nombre : "Sin mentor"}</span>
                    <span className="tabular-nums">
                      {aca}/{integrantes.length}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
