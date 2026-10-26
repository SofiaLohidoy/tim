import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/sesion";
import { eventoActual } from "@/lib/eventos";
import { completitud, estadoDelEvento } from "@/lib/organizador";
import type { ContenidoDevolucion } from "@/lib/devoluciones";
import { Panel, Titulo, Vacio } from "@/components/org/ui";
import { BotonesDevoluciones } from "./botones";

export const metadata: Metadata = { title: "Devoluciones" };

export default function Pagina() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-muted" />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  await exigirRol("organizador", "/organizador/devoluciones");
  const db = await clienteServidor();
  const evento = await eventoActual(db);
  if (!evento) return <Vacio>Primero creá el evento.</Vacio>;
  const [e, devs] = await Promise.all([
    estadoDelEvento(db, evento.id),
    db.from("devoluciones").select("estudiante_id, contenido, publicada_en, abierta_en, preparada_en").eq("evento_id", evento.id),
  ]);
  const c = completitud(e);
  const borradores = e.evaluaciones.filter((x) => x.estado === "borrador").length;
  const preparadaEn = (devs.data ?? []).reduce<string | null>((m, d) => (!m || d.preparada_en < m ? d.preparada_en : m), null);
  const desactualizada = Boolean(preparadaEn && e.evaluaciones.some((x) => x.actualizado_en > preparadaEn));
  const lista = (devs.data ?? []).sort((a, b) =>
    (e.persona.get(a.estudiante_id)?.nombre ?? "").localeCompare(e.persona.get(b.estudiante_id)?.nombre ?? "", "es"),
  );

  return (
    <>
      <Titulo ojo={evento.nombre}>Devoluciones</Titulo>
      <div className="grid gap-4">
        <Panel
          titulo="1. Preparar, revisar, publicar"
          descripcion={`Entran solo las evaluaciones enviadas: ${c.enviadas} de ${c.esperadas}. Nada llega a los estudiantes hasta que publicás.`}
        >
          <BotonesDevoluciones
            eventoId={evento.id}
            preparadas={lista.length}
            publicadas={Boolean(evento.devoluciones_publicadas_en)}
            borradores={borradores}
            desactualizada={desactualizada}
          />
          {c.enviadas < c.esperadas && !evento.devoluciones_publicadas_en && (
            <p className="mt-3 text-sm text-muted-foreground">
              ¿Alguien evaluó en papel? Cargalo en{" "}
              <Link href="/organizador/devoluciones/diferida" className="font-semibold text-violeta-texto underline">
                carga diferida
              </Link>{" "}
              antes de preparar.
            </p>
          )}
        </Panel>

        <Panel titulo={`2. Vista previa (${lista.length})`} descripcion="Lo que va a ver cada estudiante.">
          {lista.length === 0 ? (
            <Vacio>Todavía no preparaste las devoluciones.</Vacio>
          ) : (
            <ul className="grid gap-2">
              {lista.map((d) => {
                const c2 = d.contenido as unknown as ContenidoDevolucion;
                const obs = c2.dimensiones.reduce((s, x) => s + x.individual.length + x.equipo.length, 0);
                return (
                  <li key={d.estudiante_id}>
                    <details className="group rounded-2xl bg-muted px-4 py-3">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 text-sm">
                        <span className="flex-1 font-semibold">{e.persona.get(d.estudiante_id)?.nombre}</span>
                        <span className="text-muted-foreground">{c2.equipo} · {obs} observaciones</span>
                        {d.abierta_en && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">Abierta</span>}
                        {obs === 0 && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">Vacía</span>}
                      </summary>
                      <div className="mt-3 grid gap-2 text-sm">
                        {c2.dimensiones.map((x) => (
                          <div key={x.id} className="rounded-xl bg-background p-3">
                            <p className="font-semibold">{x.nombre}</p>
                            {[...x.individual, ...x.equipo].map((o, i) => (
                              <p key={i} className="text-muted-foreground">
                                {o.quien === "mentor" ? "Mentor" : "Jurado"}: {o.nivel ?? "sin nivel"}
                                {o.obs && ` — “${o.obs}”`}
                              </p>
                            ))}
                          </div>
                        ))}
                        {c2.comentarios.map((x, i) => (
                          <p key={i} className="rounded-xl bg-background p-3">
                            <span className="font-semibold">{x.quien === "mentor" ? "Mentor" : "Jurado"}:</span> {x.texto}
                          </p>
                        ))}
                      </div>
                    </details>
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
