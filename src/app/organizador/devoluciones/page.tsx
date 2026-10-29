import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/sesion";
import { eventoActual, nombreDe } from "@/lib/eventos";
import { z } from "zod";
import type { ContenidoDevolucion } from "@/lib/devoluciones";
import { Panel, Titulo, Vacio } from "@/components/org/ui";
import { BotonesDevoluciones } from "./botones";

export const metadata: Metadata = { title: "Devoluciones" };

export default function Pagina({searchParams}:PageProps<"/organizador/devoluciones">) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-muted" />}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenido({searchParams}:{searchParams:PageProps<"/organizador/devoluciones">["searchParams"]}) {
  await exigirRol("organizador", "/organizador/devoluciones");
  const db = await clienteServidor();
  const params=await searchParams;
  const seleccionado=params.evento===undefined?null:z.uuid().safeParse(params.evento);
  if(seleccionado&&!seleccionado.success)return <Vacio>El enlace del evento no es válido.</Vacio>;
  const evento = seleccionado?.success?(await db.from("eventos").select("*").eq("id",seleccionado.data).maybeSingle()).data:await eventoActual(db);
  if (!evento) return <Vacio>Primero creá el evento.</Vacio>;
  const [miembros,asignaciones,evaluaciones,devs,pendientes] = await Promise.all([
    db.from("miembros_equipo").select("usuario_id,equipo_id,perfiles(nombre,apellido)").eq("evento_id",evento.id),
    db.from("asignaciones").select("equipo_id,rol").eq("evento_id",evento.id),
    db.from("evaluaciones").select("estado").eq("evento_id",evento.id),
    db.from("devoluciones").select("estudiante_id, contenido, publicada_en, abierta_en, preparada_en").eq("evento_id", evento.id),
    db.from("devoluciones_borrador").select("estudiante_id,contenido,preparada_en").eq("evento_id",evento.id),
  ]);
  if(miembros.error||asignaciones.error||evaluaciones.error||devs.error||pendientes.error)return <Vacio>No pudimos cargar las devoluciones. Recargá la página.</Vacio>;
  const publicadas=(devs.data??[]).some(d=>Boolean(d.publicada_en));
  const persona=new Map((miembros.data??[]).map(m=>[m.usuario_id,nombreDe(m.perfiles)]));
  const c={enviadas:(evaluaciones.data??[]).filter(e=>e.estado==="enviada").length,esperadas:(asignaciones.data??[]).reduce((n,a)=>n+(a.rol==="mentor"?(miembros.data??[]).filter(m=>m.equipo_id===a.equipo_id).length:1),0)};
  const borradores = (evaluaciones.data??[]).filter(x=>x.estado==="borrador").length;
  const desactualizada = (pendientes.data ?? []).length > 0 && Boolean((await db.rpc("devoluciones_desactualizadas", { p_evento: evento.id })).data);
  const lista = (pendientes.data?.length?pendientes.data.map(d=>({...d,abierta_en:null})):devs.data??[]).sort((a, b) =>
    (persona.get(a.estudiante_id) ?? "").localeCompare(persona.get(b.estudiante_id) ?? "", "es"),
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
            preparadas={pendientes.data?.length??0}
            publicadas={publicadas}
            borradores={borradores}
            desactualizada={desactualizada}
          />
          {c.enviadas < c.esperadas && (
            <p className="mt-3 text-sm text-muted-foreground">
              ¿Alguien evaluó en papel? Cargalo en{" "}
              <Link href="/organizador/devoluciones/diferida" className="font-semibold text-violeta-texto underline">
                carga diferida
              </Link>{" "}
              antes de preparar.
            </p>
          )}
        </Panel>

        <Panel titulo={`2. Vista previa (${lista.length})`} descripcion={pendientes.data?.length?"Nueva versión preparada. Todavía no es visible para los estudiantes.":publicadas?"Versión que ven los estudiantes. Podés preparar otra publicación arriba.":"Lo que va a ver cada estudiante."}>
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
                        <span className="flex-1 font-semibold">{persona.get(d.estudiante_id)}</span>
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
