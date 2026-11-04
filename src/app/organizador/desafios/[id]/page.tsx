import {horaSolicitudVirtual} from "@/lib/desafios-virtuales-servidor";
import {Suspense} from "react";
import Link from "next/link";
import {z} from "zod";
import {Button} from "@/components/ui/button";
import {exigirRol} from "@/lib/sesion";
import {clienteServidor} from "@/lib/supabase/servidor";
import {nombreDe} from "@/lib/eventos";
import {Panel,Titulo,Vacio} from "@/components/org/ui";
import {Campo,claseInput} from "@/components/org/campos";
import {FormularioVirtual} from "@/components/app/formulario-virtual";
import {SubirArchivoVirtual} from "@/components/app/subir-archivo-virtual";
import {camposTexto,CRITERIOS_VIRTUALES,fechaVirtual,fechaInputArgentina} from "@/lib/desafios-virtuales";
import {guardarDesafio,cambiarEstado,cambiarAcceso,guardarDefensa,guardarRevision,eliminarDesafio} from "../acciones";
export const metadata={title:"Administrar desafío virtual"};
export default function Pagina({params}:PageProps<"/organizador/desafios/[id]">){return <Suspense fallback={<p>Cargando desafío…</p>}><Contenido params={params}/></Suspense>;}
async function Contenido({params}:{params:PageProps<"/organizador/desafios/[id]">["params"]}){
 await exigirRol("organizador");const {id}=await params;if(!z.uuid().safeParse(id).success)return <Vacio>El desafío no es válido.</Vacio>;const db=await clienteServidor();const ahora=await horaSolicitudVirtual();
 const [d,accesos,participaciones,archivos,revisiones,personas]=await Promise.all([
  db.from("desafios_virtuales").select("*").eq("id",id).maybeSingle(),
  db.from("accesos_desafios_virtuales").select("*,perfiles(nombre,apellido,email)").eq("desafio_id",id),
  db.from("participaciones_virtuales").select("*").eq("desafio_id",id),
  db.from("archivos_desafios_virtuales").select("id,nombre,tipo,usuario_id").eq("desafio_id",id).order("creado_en",{ascending:false}),
  db.from("revisiones_virtuales").select("*").eq("desafio_id",id),
  db.from("estudiantes").select("usuario_id,perfiles(nombre,apellido,email)").limit(500),
 ]);
 if(d.error||accesos.error||participaciones.error||archivos.error||revisiones.error||personas.error)return <Vacio>No pudimos cargar el desafío. Recargá la página.</Vacio>;
 if(!d.data)return <Vacio>No encontramos el desafío.</Vacio>;const desafio=d.data;const original=archivos.data.find(a=>a.tipo==="consigna"),iniciados=participaciones.data.length;
 const opciones=personas.data.map(p=>({id:p.usuario_id,nombre:nombreDe(p.perfiles),email:p.perfiles?.email??""})).sort((a,b)=>a.nombre.localeCompare(b.nombre,"es"));
 return <><Link href="/organizador/desafios" className="mb-4 inline-block text-sm underline">Volver a Desafíos virtuales</Link><Titulo ojo="Piloto privado">{desafio.titulo}</Titulo>
 <div className="grid gap-4">
  <div className="grid gap-4 lg:grid-cols-2">
   <Panel titulo="Consigna" descripcion={iniciados?"La consigna quedó fijada porque ya hay personas que comenzaron.":"Podés editarla mientras nadie haya comenzado."}>
    {iniciados?<div className="space-y-3"><p className="text-sm">{desafio.duracion_horas} horas desde Comenzar.</p><p className="whitespace-pre-line break-words text-sm leading-relaxed">{desafio.consigna}</p></div>:<FormularioVirtual action={guardarDesafio} boton="Guardar consigna"><input type="hidden" name="id" value={id}/><Campo etiqueta="Título *" htmlFor="titulo"><input id="titulo" name="titulo" defaultValue={desafio.titulo} required maxLength={160} className={claseInput}/></Campo><Campo etiqueta="Consigna *" htmlFor="consigna"><textarea id="consigna" name="consigna" defaultValue={desafio.consigna} required maxLength={30000} className={claseInput.replace("h-11","min-h-72 py-3")}/></Campo><Campo etiqueta="Horas desde Comenzar *" htmlFor="horas"><input id="horas" name="horas" type="number" min={1} max={168} defaultValue={desafio.duracion_horas} required className={claseInput}/></Campo></FormularioVirtual>}
    <div className="mt-5">{original&&<Link href={`/desafios/archivos/${original.id}`} className="mb-3 block break-words text-violeta-texto underline">{original.nombre}</Link>}{!iniciados&&<SubirArchivoVirtual desafio={id} tipo="consigna"/>}</div>
   </Panel>
   <div className="grid content-start gap-4">
    <Panel titulo="Disponibilidad" descripcion="Solo lo ven las personas con acceso habilitado."><FormularioVirtual action={cambiarEstado} boton="Aplicar estado"><input type="hidden" name="desafio" value={id}/><Campo etiqueta="Estado" htmlFor="estado"><select id="estado" name="estado" defaultValue={desafio.estado} className={claseInput}><option value="borrador">Borrador · solo organización</option><option value="disponible">Disponible · solo invitados</option><option value="cerrado">Cerrado · no recibe entregas</option></select></Campo><label className="flex items-start gap-2 text-sm"><input type="checkbox" required name="confirmar" className="mt-1 size-5 shrink-0"/>Confirmo aplicar el estado a las personas habilitadas.</label></FormularioVirtual></Panel>
    <Panel titulo="Habilitar una persona"><FormularioVirtual action={cambiarAcceso} boton="Habilitar acceso"><input type="hidden" name="desafio" value={id}/><input type="hidden" name="habilitar" value="si"/><Campo etiqueta="Usuario *" htmlFor="usuario"><select id="usuario" name="usuario" required defaultValue="" className={claseInput}><option value="" disabled>Elegí una persona…</option>{opciones.map(p=><option key={p.id} value={p.id}>{p.nombre} · {p.email}</option>)}</select></Campo></FormularioVirtual></Panel>
   </div>
  </div>
  <Panel titulo={`Participantes (${accesos.data.length})`} descripcion="Quitar acceso conserva el historial y los archivos. No se envían invitaciones por mail automáticamente.">
   {accesos.data.length===0?<Vacio>Todavía no habilitaste a nadie.</Vacio>:<ul className="grid gap-3">{accesos.data.map(a=>{
    const p=participaciones.data.find(x=>x.usuario_id===a.usuario_id),r=revisiones.data.find(x=>x.usuario_id===a.usuario_id),datos=camposTexto(p?.borrador),borrador=camposTexto(r?.borrador);const estado=!a.habilitado?"Acceso quitado":p?.enviada_en?"Entrega enviada":p?ahora>new Date(p.vence_en).getTime()?"Plazo terminado":"En curso":"Sin empezar";const archivo=archivos.data.find(x=>x.id===p?.investigacion_id);
    return <li key={a.usuario_id}><details className="rounded-2xl bg-muted p-4"><summary className="cursor-pointer"><span className="font-semibold">{nombreDe(a.perfiles)}</span><span className="mt-1 block break-words text-sm text-muted-foreground">{a.perfiles?.email} · {estado}</span></summary><div className="mt-4 grid gap-5">
     {p&&<p className="text-sm">Comenzó: {fechaVirtual(p.iniciada_en)} · Límite: {fechaVirtual(p.vence_en)} (Argentina)</p>}
     <FormularioVirtual action={cambiarAcceso} boton={a.habilitado?"Quitar acceso":"Restablecer acceso"}><input type="hidden" name="desafio" value={id}/><input type="hidden" name="usuario" value={a.usuario_id}/><input type="hidden" name="habilitar" value={a.habilitado?"no":"si"}/>{a.habilitado&&<label className="flex items-start gap-2 text-sm"><input type="checkbox" required name="confirmar" className="mt-1 size-5 shrink-0"/>Confirmo quitarle el acceso. Su entrega se conservará.</label>}</FormularioVirtual>
     <div><h3 className="mb-3 font-bold">Defensa · 20 minutos</h3><FormularioVirtual action={guardarDefensa} boton="Guardar defensa"><input type="hidden" name="desafio" value={id}/><input type="hidden" name="usuario" value={a.usuario_id}/><Campo etiqueta="Fecha y hora (Argentina)" htmlFor={`fecha-${a.usuario_id}`}><input id={`fecha-${a.usuario_id}`} name="fecha" type="datetime-local" defaultValue={fechaInputArgentina(a.defensa_en)} className={claseInput}/></Campo><Campo etiqueta="Enlace de la reunión" htmlFor={`url-${a.usuario_id}`}><input id={`url-${a.usuario_id}`} name="url" type="url" placeholder="https://" defaultValue={a.defensa_url??""} className={claseInput}/></Campo><p className="text-xs text-muted-foreground">La fecha y el enlace se comparten con esta persona al guardarlos.</p></FormularioVirtual></div>
     {p?.enviada_en&&<><section><h3 className="font-bold">Entrega recibida</h3><p className="my-2 text-sm">{fechaVirtual(p.enviada_en)}</p>{archivo&&<Link href={`/desafios/archivos/${archivo.id}`} className="my-2 block break-words text-violeta-texto underline">{archivo.nombre}</Link>}<div className="space-y-2">{Object.entries(datos).filter(([,v])=>v).map(([k,v])=><p className="break-words text-sm" key={k}>{k.endsWith("_url")?<a href={v} target="_blank" rel="noopener noreferrer" className="text-violeta-texto underline">{({investigacion_url:"Informe de investigación",repo_url:"Repositorio de GitHub",demo_url:"Plataforma o dashboard",video_url:"Video demostrativo en Loom"} as Record<string,string>)[k]}</a>:v}</p>)}</div></section>
      <section><h3 className="mb-3 font-bold">Revisión humana</h3>{r?.publicada_en&&<p className="mb-3 text-sm">Última publicación: {fechaVirtual(r.publicada_en)}</p>}<FormularioVirtual action={guardarRevision} boton="Guardar borrador de devolución"><input type="hidden" name="desafio" value={id}/><input type="hidden" name="usuario" value={a.usuario_id}/>{CRITERIOS_VIRTUALES.map(c=><Campo key={c.id} etiqueta={c.titulo} htmlFor={`${c.id}-${a.usuario_id}`}><textarea id={`${c.id}-${a.usuario_id}`} name={c.id} maxLength={3000} defaultValue={borrador[c.id]??""} className={claseInput.replace("h-11","min-h-24 py-3")}/></Campo>)}<label className="flex items-start gap-2 text-sm"><input type="checkbox" name="confirmar" className="mt-1 size-5 shrink-0"/>Revisé el texto y confirmo publicarlo para esta persona.</label><Button type="submit" name="publicar" value="si" className="min-h-11 rounded-xl">Publicar devolución individual</Button></FormularioVirtual></section>
     </>}
    </div></details></li>;
   })}</ul>}
  </Panel>
  <Panel titulo="Eliminar este desafío" descripcion="Se retiran la consigna, los accesos y las participaciones de esta versión. Las cuentas de las personas se conservan."><details><summary className="min-h-11 cursor-pointer py-3 font-semibold text-destructive">Revisar eliminación</summary><p className="my-3 text-sm">Afecta a {accesos.data.length} personas habilitadas o con historial. Antes de eliminar, TIM guarda un respaldo privado del desafío, sus entregas y sus archivos.</p><FormularioVirtual action={eliminarDesafio} boton="Respaldar y eliminar desafío"><input type="hidden" name="desafio" value={id}/><Campo etiqueta="Título para confirmar *" htmlFor="titulo-eliminar" ayuda={desafio.titulo}><input id="titulo-eliminar" name="titulo" required maxLength={160} autoComplete="off" className={claseInput}/></Campo><label className="flex items-start gap-2 text-sm"><input type="checkbox" name="confirmar" required className="mt-1 size-5 shrink-0"/>Confirmo eliminar esta versión y sus participaciones.</label></FormularioVirtual></details></Panel>
 </div></>;
}
