import {horaSolicitudVirtual} from "@/lib/desafios-virtuales-servidor";
import {Suspense} from "react";
import Link from "next/link";
import {z} from "zod";
import {Button} from "@/components/ui/button";
import {exigirUsuario} from "@/lib/sesion";
import {clienteServidor} from "@/lib/supabase/servidor";
import {camposTexto,fechaVirtual,CRITERIOS_VIRTUALES} from "@/lib/desafios-virtuales";
import {Campo,claseInput} from "@/components/org/campos";
import {FormularioVirtual} from "@/components/app/formulario-virtual";
import {SubirArchivoVirtual} from "@/components/app/subir-archivo-virtual";
import {comenzarDesafio,guardarEntrega} from "../acciones";
export const metadata={title:"Tu desafío virtual"};
export default function Pagina({params}:PageProps<"/desafios/[id]">){return <main className="mx-auto w-full max-w-2xl px-5 pt-6 pb-28"><Suspense fallback={<p>Cargando desafío…</p>}><Contenido params={params}/></Suspense></main>;}
async function Contenido({params}:{params:PageProps<"/desafios/[id]">["params"]}){
 const {id}=await params;const u=await exigirUsuario(`/desafios/${id}`);if(!z.uuid().safeParse(id).success)return <p>El desafío no es válido.</p>;const db=await clienteServidor();const ahora=await horaSolicitudVirtual();
 const [d,a,p,archivos,revision]=await Promise.all([db.from("desafios_virtuales").select("*").eq("id",id).maybeSingle(),db.from("accesos_desafios_virtuales").select("defensa_en,defensa_url,habilitado").eq("desafio_id",id).eq("usuario_id",u.id).maybeSingle(),db.from("participaciones_virtuales").select("*").eq("desafio_id",id).eq("usuario_id",u.id).maybeSingle(),db.from("archivos_desafios_virtuales").select("id,nombre,tipo").eq("desafio_id",id).order("creado_en",{ascending:false}),db.rpc("mi_revision_virtual",{p_desafio:id})]);
 if(d.error||a.error||p.error||archivos.error||revision.error)return <p>No pudimos cargar el desafío. Recargá la página.</p>;
 if(!d.data||!a.data?.habilitado)return <div><h1 className="text-2xl font-extrabold">Desafío no disponible</h1><p className="mt-3">No tenés acceso a este desafío. Consultá con organización.</p><Link href="/actividades" className="mt-4 inline-block underline">Volver a Actividades</Link></div>;
 const desafio=d.data,part=p.data,datos=camposTexto(part?.borrador),original=archivos.data.find(x=>x.tipo==="consigna"),archivo=archivos.data.find(x=>x.id===part?.investigacion_id);
 const editable=desafio.estado==="disponible"&&part&&!part.enviada_en&&ahora<=new Date(part.vence_en).getTime();
 const publicado=revision.data&&typeof revision.data==="object"&&!Array.isArray(revision.data)?revision.data as {contenido?:unknown}:null;const devolucion=camposTexto(publicado?.contenido);
 return <div className="grid gap-5"><Link href="/actividades" className="text-sm underline">Volver a Actividades</Link><header><p className="text-xs font-semibold tracking-widest text-violeta-texto uppercase">Privado · Individual</p><h1 className="mt-2 text-2xl font-extrabold">{desafio.titulo}</h1><p className="mt-2 text-muted-foreground">{desafio.duracion_horas} horas desde que comenzás. Trabajo asíncrono y defensa de 20 minutos.</p></header>
  <section className="rounded-3xl bg-card p-5 ring-1 ring-border"><h2 className="text-lg font-bold">Consigna</h2><div className="mt-3 space-y-4">{desafio.consigna.split(/\n\s*\n/).map((t,i)=><p key={i} className="whitespace-pre-line break-words text-[15px] leading-relaxed">{t}</p>)}</div>{original&&<Link className="mt-4 inline-block font-semibold text-violeta-texto underline" href={`/desafios/archivos/${original.id}`}>Descargar consigna original (PDF)</Link>}</section>
  {!part&&desafio.estado==="disponible"&&<section className="rounded-3xl bg-lila-claro p-5"><h2 className="mb-3 font-bold">Cuando estés listo</h2><FormularioVirtual action={comenzarDesafio} boton="Comenzar desafío"><input type="hidden" name="desafio" value={id}/><p>El plazo de {desafio.duracion_horas} horas empieza al tocar Comenzar. Confirmá antes tus accesos a las herramientas con organización.</p></FormularioVirtual></section>}
  {desafio.estado==="cerrado"&&<p className="rounded-2xl bg-muted p-4">Este desafío cerró sus entregas.</p>}
  {part&&<section className="rounded-3xl bg-card p-5 ring-1 ring-border"><h2 className="text-lg font-bold">Tu entrega</h2><p className="my-3 text-sm text-muted-foreground">{part.enviada_en?`Enviada: ${fechaVirtual(part.enviada_en)}`:`Fecha límite: ${fechaVirtual(part.vence_en)} (Argentina).`}</p>
   {archivo&&<Link className="mb-4 block break-words text-violeta-texto underline" href={`/desafios/archivos/${archivo.id}`}>{archivo.nombre}</Link>}
   {editable?<><SubirArchivoVirtual desafio={id} tipo="investigacion"/><div className="mt-5"><FormularioVirtual action={guardarEntrega} boton="Guardar borrador"><input type="hidden" name="desafio" value={id}/>
    <Campo etiqueta="Integración elegida *" htmlFor="via"><select id="via" name="via" defaultValue={datos.via??""} className={claseInput}><option value="">Elegí una vía…</option><option value="B1">B1 · Grokbot</option><option value="B2">B2 · WhatsApp</option><option value="B3">B3 · Redes sociales</option></select></Campo>
    {[{id:"investigacion_url",titulo:"Enlace de investigación",ayuda:"Alternativa al archivo. PDF, Word, Markdown o enlace a tu documento."},{id:"repo_url",titulo:"Repositorio *",ayuda:"Incluí README y DECISIONS.md."},{id:"demo_url",titulo:"Demo",ayuda:"Si está disponible. También aceptamos una demo reproducible en el repositorio y el video."},{id:"video_url",titulo:"Video de la demo *",ayuda:"Enlace a un video de aproximadamente 2½ minutos."}].map(c=><Campo key={c.id} etiqueta={c.titulo} htmlFor={c.id} ayuda={c.ayuda}><input id={c.id} name={c.id} type="url" maxLength={2000} defaultValue={datos[c.id]??""} placeholder="https://" className={claseInput}/></Campo>)}
    <Campo etiqueta="Decisiones y dificultades *" htmlFor="decisiones"><textarea id="decisiones" name="decisiones" maxLength={6000} defaultValue={datos.decisiones??""} className={claseInput.replace("h-11","min-h-40 py-3")}/></Campo>
    <p className="text-xs text-muted-foreground">* Obligatorio para enviar. La investigación requiere un archivo o un enlace. Podés guardar un borrador incompleto.</p>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="confirmar" className="mt-1 size-5 shrink-0"/>Revisé mi entrega. Entiendo que después de enviarla no podré modificarla.</label><Button type="submit" name="enviar" value="si" className="min-h-11 rounded-xl">Confirmar entrega</Button>
   </FormularioVirtual></div></>:<div className="space-y-3">{!part.enviada_en&&<p>{desafio.estado==="cerrado"?"Las entregas están cerradas.":"El plazo terminó."} Tu borrador se conserva, pero ya no se puede modificar.</p>}{Object.entries(datos).filter(([,v])=>v).map(([k,v])=><p key={k} className="break-words">{k.endsWith("_url")?<a href={v} target="_blank" rel="noopener noreferrer" className="text-violeta-texto underline">{({investigacion_url:"Investigación",repo_url:"Repositorio",demo_url:"Demo",video_url:"Video"} as Record<string,string>)[k]}</a>:v}</p>)}</div>}
  </section>}
  {(a.data.defensa_en||a.data.defensa_url)&&<section className="rounded-3xl bg-lila-claro p-5"><h2 className="font-bold">Tu defensa · 20 minutos</h2>{a.data.defensa_en&&<p className="mt-2">{fechaVirtual(a.data.defensa_en)} (Argentina)</p>}{a.data.defensa_url&&<a href={a.data.defensa_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block underline">Abrir enlace de la defensa</a>}</section>}
  {Object.keys(devolucion).length>0&&<section className="rounded-3xl bg-card p-5 ring-1 ring-border"><h2 className="text-lg font-bold">Tu devolución</h2><div className="mt-4 space-y-4">{CRITERIOS_VIRTUALES.filter(c=>devolucion[c.id]).map(c=><div key={c.id}><h3 className="font-semibold">{c.titulo}</h3><p className="mt-1 whitespace-pre-line break-words leading-relaxed">{devolucion[c.id]}</p></div>)}</div></section>}
 </div>;
}
