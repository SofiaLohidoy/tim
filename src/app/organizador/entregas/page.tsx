import type { Metadata } from "next";
import { Suspense } from "react";
import { z } from "zod";
import { ExternalLink, FileDown } from "lucide-react";
import { exigirRol } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";
import { Titulo, Vacio } from "@/components/org/ui";
export const metadata: Metadata = {title:"Entregas"};
export default function Pagina({searchParams}:PageProps<"/organizador/entregas">){return <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-muted"/>}><Contenido searchParams={searchParams}/></Suspense>;}
async function Contenido({searchParams}:{searchParams:PageProps<"/organizador/entregas">["searchParams"]}){
  await exigirRol("organizador","/organizador/entregas");
  const db=await clienteServidor();
  const valor=(await searchParams).evento;
  const consulta=db.from("equipos").select("id,nombre,entrega_url,entrega_en,eventos(nombre),entregas_equipo(archivo_nombre,actualizado_en)").order("nombre");
  if(valor!==undefined){const v=z.uuid().safeParse(valor);if(!v.success)return <Vacio>El enlace del evento no es válido.</Vacio>;consulta.eq("evento_id",v.data);}
  const equipos=await consulta;
  if(equipos.error)return <Vacio>No pudimos cargar las entregas. Recargá la página.</Vacio>;
  return <><Titulo ojo="Hackatón">Entregas</Titulo>
    {valor&&<a href="/organizador/entregas" className="mb-4 inline-flex min-h-11 items-center font-semibold text-violeta-texto">Ver todos los eventos</a>}
    {!equipos.data.length?<Vacio>Todavía no hay equipos creados. Sus entregas van a aparecer acá.</Vacio>:<div className="overflow-hidden rounded-3xl bg-card ring-1 ring-border">
      <div className="hidden grid-cols-[1fr_1fr_1fr_1.5fr] gap-4 border-b border-border px-5 py-3 text-xs font-semibold text-muted-foreground md:grid" aria-hidden="true"><span>Equipo</span><span>Evento</span><span>Actualizada</span><span>Entrega</span></div>
      <ul aria-label="Entregas de equipos">{equipos.data.map(q=>{
        const archivo=q.entregas_equipo;
        const fecha=archivo?.actualizado_en??q.entrega_en;
        return <li key={q.id} className="grid gap-3 border-b border-border p-5 last:border-0 md:grid-cols-[1fr_1fr_1fr_1.5fr] md:items-center md:gap-4">
          <h2 className="font-heading font-bold">{q.nombre}</h2><p className="text-sm text-muted-foreground">{q.eventos?.nombre}</p>
          <p className="text-sm text-muted-foreground">{fecha?new Intl.DateTimeFormat("es-AR",{dateStyle:"short",timeStyle:"short",timeZone:"America/Argentina/Buenos_Aires"}).format(new Date(fecha)):"—"}</p>
          <div className="grid min-w-0 gap-1">
            {archivo&&<><span className="break-words text-sm">{archivo.archivo_nombre}</span><a href={`/entregas/${q.id}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-violeta-texto"><FileDown className="size-4"/>Ver archivo<span className="sr-only"> de {q.nombre}</span></a></>}
            {q.entrega_url&&<a href={q.entrega_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-violeta-texto"><ExternalLink className="size-4"/>Ver link<span className="sr-only"> de {q.nombre}</span></a>}
            {!archivo&&!q.entrega_url&&<span className="text-sm text-muted-foreground">Sin entrega</span>}
          </div>
        </li>;
      })}</ul>
    </div>}
    <p className="mt-4 text-sm text-muted-foreground">Acá aparecen las entregas del equipo. Los CV personales se consultan desde Personas y no se comparten con el jurado.</p>
  </>;
}
