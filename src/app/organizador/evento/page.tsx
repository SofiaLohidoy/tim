import type { Metadata } from "next";
import { Suspense } from "react";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/sesion";
import { eventoActual } from "@/lib/eventos";
import { rubricaDelEvento } from "@/lib/rubrica";
import { Panel, Titulo } from "@/components/org/ui";
import { FormDesafio, FormEvento } from "./formularios";

export const metadata: Metadata = { title: "Evento" };

export default function Pagina() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-muted" />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  await exigirRol("organizador", "/organizador/evento");
  const db = await clienteServidor();
  const evento = await eventoActual(db);
  const [desafio, rubrica] = await Promise.all([
    evento ? db.from("desafios").select("titulo, consigna, estado").eq("evento_id", evento.id).maybeSingle() : null,
    rubricaDelEvento(db, evento?.rubrica_id ?? null),
  ]);

  return (
    <>
      <Titulo ojo="Evento">{evento ? evento.nombre : "Crear el evento"}</Titulo>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel titulo="Datos del evento">
          <FormEvento evento={evento} />
        </Panel>
        {evento && (
          <Panel titulo="Desafío" descripcion={desafio?.data?.estado === "publicado" ? "Publicado: lo ven los estudiantes." : "En borrador: todavía no lo ve nadie."}>
            <FormDesafio eventoId={evento.id} desafio={desafio?.data ?? null} />
          </Panel>
        )}
        {rubrica && (
          <Panel titulo="Rúbrica" descripcion={`${rubrica.nombre}. El mentor evalúa a cada persona; el jurado, al equipo.`} className="lg:col-span-2">
            <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
              <ul className="grid gap-2">
                {rubrica.dimensiones.map((d) => (
                  <li key={d.id} className="rounded-2xl bg-muted px-4 py-3">
                    <p className="font-semibold">
                      {d.orden}. {d.nombre}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        {d.instancia === "ambas" ? "mentor y jurado" : d.instancia === "individual" ? "solo mentor" : "solo jurado"}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">{d.que_observar}</p>
                  </li>
                ))}
              </ul>
              <ul className="grid content-start gap-2">
                {rubrica.niveles.map((n) => (
                  <li key={n.id} className="rounded-2xl ring-1 ring-border px-4 py-3">
                    <p className="font-semibold">{n.nombre}</p>
                    <p className="text-sm text-muted-foreground">{n.descripcion}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}
