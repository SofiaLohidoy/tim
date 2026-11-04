"use client";
import {useActionState,useState,useSyncExternalStore} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {claseInput,Mensaje} from "@/components/org/campos";
import {SubirArchivoVirtual} from "./subir-archivo-virtual";
import {validarEntregaVirtual,type CampoEntregaVirtual,type ResultadoEntregaVirtual} from "@/lib/desafios-virtuales";
import {guardarEntrega} from "@/app/desafios/acciones";

// Evita perder archivos o escritura si se interactúa antes de hidratar el formulario.
// React getServerSnapshot: https://react.dev/reference/react/useSyncExternalStore (04/11/2026).
const suscribir=()=>()=>{};
const cliente=()=>true;
const servidor=()=>false;

export function EntregaPaperclip({desafio,datos,archivo}:{desafio:string;datos:Record<string,string>;archivo?:{id:string;nombre:string}}){
 const hidratado=useSyncExternalStore(suscribir,cliente,servidor);
 const [estado,accion,pendiente]=useActionState<ResultadoEntregaVirtual,FormData>(guardarEntrega,{});
 const [errores,setErrores]=useState<Record<string,string>>({}),[nuevoArchivo,setNuevoArchivo]=useState<typeof archivo>(),[subiendo,setSubiendo]=useState(false);
 const [valores,setValores]=useState<Record<string,string>>(()=>Object.fromEntries(["investigacion_url","repo_url","demo_url","video_url"].map(k=>[k,datos[k]??""])));
 const informe=nuevoArchivo??archivo;
 const avisos={...estado.errores,...errores};
 function campo(id:CampoEntregaVirtual,etiqueta:string,ayuda?:string){return <div className="grid gap-2"><label htmlFor={id} className="text-sm font-semibold">{etiqueta}</label>{ayuda&&<p id={`${id}-ayuda`} className="text-sm leading-relaxed text-muted-foreground">{ayuda}</p>}<input id={id} name={id} type="url" maxLength={2000} value={valores[id]} onChange={e=>setValores(p=>({...p,[id]:e.target.value}))} placeholder="https://" aria-invalid={Boolean(avisos[id])} aria-describedby={[ayuda?`${id}-ayuda`:"",avisos[id]?`${id}-error`:""].filter(Boolean).join(" ")||undefined} className={`${claseInput} ${avisos[id]?"ring-2 ring-destructive":""}`}/>{avisos[id]&&<p id={`${id}-error`} role="alert" className="text-sm text-destructive">{avisos[id]}</p>}</div>;}
 return <form action={accion} noValidate onSubmit={e=>{
  const enviar=(e.nativeEvent as SubmitEvent).submitter?.getAttribute("name")==="enviar";
  const f=new FormData(e.currentTarget);const v=validarEntregaVirtual(Object.fromEntries(f),Boolean(informe),enviar);const faltas={...v.errores};
  if(enviar&&f.get("confirmar")!=="on")faltas.confirmar="Confirmá que revisaste la entrega antes de enviarla.";
  setErrores(faltas);if(Object.keys(faltas).length){e.preventDefault();e.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(faltas)[0]}"]`)?.focus();}
 }} className="grid gap-5">
  <input type="hidden" name="desafio" value={desafio}/>
  <p className="text-sm leading-relaxed">Revisá los entregables indicados en la guía y asegurate de que los enlaces permitan al equipo evaluador acceder al contenido.</p>
  <fieldset disabled={!hidratado||pendiente||subiendo} className="grid min-w-0 gap-6">
   <section aria-labelledby="informe-titulo" className="grid gap-3 rounded-2xl border border-border p-4"><h3 id="informe-titulo" className="font-bold">1. Informe de investigación *</h3><p className="text-sm leading-relaxed text-muted-foreground">Presentá tu análisis de Paperclip siguiendo la Parte 1 de la guía. Máximo una página o equivalente. El enlace debe llevar a tu propio informe, no a las fuentes que consultaste.</p><p className="text-sm font-medium">Elegí una alternativa: archivo o enlace.</p>{informe&&<Link href={`/desafios/archivos/${informe.id}`} className="break-words text-sm text-violeta-texto underline">{informe.nombre}</Link>}<SubirArchivoVirtual desafio={desafio} tipo="investigacion" etiqueta="Subir informe" onOcupado={setSubiendo} onSubido={a=>{setNuevoArchivo(a);setErrores(p=>({...p,investigacion_url:""}));}}/>{campo("investigacion_url","Enlace a tu informe")}</section>
   <section aria-labelledby="repo-titulo" className="grid gap-3 rounded-2xl border border-border p-4"><h3 id="repo-titulo" className="font-bold">2. Repositorio de GitHub *</h3>{campo("repo_url","Enlace al repositorio de GitHub","Incluí tu implementación, un README con instrucciones y comandos para reproducirla en un máximo de 10 minutos y un archivo DECISIONS.md de media página con la integración elegida y su motivo, qué funcionó, qué no funcionó y qué mejorarías.")}</section>
   <section aria-labelledby="plataforma-titulo" className="grid gap-3 rounded-2xl border border-border p-4"><h3 id="plataforma-titulo" className="font-bold">3. Plataforma o dashboard *</h3>{campo("demo_url","Enlace a la plataforma o dashboard","Compartí el enlace a tu plataforma o dashboard desplegado en Vercel, según la guía.")}</section>
   <section aria-labelledby="video-titulo" className="grid gap-3 rounded-2xl border border-border p-4"><h3 id="video-titulo" className="font-bold">4. Video demostrativo en Loom *</h3><p className="text-sm font-medium">Máximo 2 minutos y medio.</p>{campo("video_url","Enlace al video demostrativo en Loom","Mostrá el flujo desde una tarea en Paperclip hasta la acción o conexión con la herramienta elegida y su resultado visible.")}</section>
   <p className="text-xs text-muted-foreground">* Obligatorio para enviar. Podés guardar un borrador incompleto.</p>
   <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="confirmar" aria-invalid={Boolean(avisos.confirmar)} aria-describedby={avisos.confirmar?"confirmar-error":undefined} className="mt-1 size-5 shrink-0"/>Revisé mi entrega. Entiendo que después de enviarla no podré modificarla.</label>{avisos.confirmar&&<p id="confirmar-error" role="alert" className="text-sm text-destructive">{avisos.confirmar}</p>}
   <Button type="submit" name="enviar" value="si" className="min-h-11 rounded-xl">{pendiente?"Guardando…":"Confirmar entrega"}</Button><Button type="submit" variant="outline" className="min-h-11 justify-self-start rounded-xl">Guardar borrador</Button>
  </fieldset><Mensaje r={pendiente?{}:estado}/>
 </form>;
}
