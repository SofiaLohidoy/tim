"use server";
import {z} from "zod";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {clienteServidor} from "@/lib/supabase/servidor";
import {exigirRol} from "@/lib/sesion";
import type {Json} from "@/lib/supabase/tipos";
import {CRITERIOS_VIRTUALES} from "@/lib/desafios-virtuales";
import type {ResultadoVirtual} from "@/components/app/formulario-virtual";
// PostgREST no infiere los argumentos SQL anulables: estas RPC aceptan null explícitamente.
const errores:Record<string,string>={consigna_en_uso:"Ya hay personas que comenzaron. La consigna y el plazo no se pueden cambiar.",falta_consigna:"Primero cargá el PDF de la consigna.",sin_entrega:"La persona todavía no envió su entrega.",revision_vacia:"Escribí una devolución antes de publicarla."};
function fallo(m:string){return Object.entries(errores).find(([k])=>m.includes(k))?.[1]??"No pudimos guardar. Revisá los datos y probá de nuevo.";}
function refrescar(id:string){revalidatePath(`/organizador/desafios/${id}`);revalidatePath("/organizador/desafios");revalidatePath("/actividades");revalidatePath(`/desafios/${id}`);}
export async function eliminarDesafio(_p:ResultadoVirtual,f:FormData):Promise<ResultadoVirtual>{
 await exigirRol("organizador");const v=z.object({desafio:z.uuid(),titulo:z.string().min(3).max(160),confirmar:z.literal("on")}).safeParse(Object.fromEntries(f));
 if(!v.success)return {error:"Escribí el título completo y confirmá la eliminación."};
 const db=await clienteServidor();const r=await db.rpc("eliminar_desafio_virtual",{p_desafio:v.data.desafio,p_titulo:v.data.titulo});
 if(r.error)return {error:r.error.message.includes("confirmacion_incorrecta")?"El título no coincide. Copialo tal como aparece arriba.":"No pudimos eliminar el desafío. Recargá y probá de nuevo."};
 refrescar(v.data.desafio);redirect("/organizador/desafios?eliminado=si");
}
export async function guardarDesafio(_p:ResultadoVirtual,f:FormData):Promise<ResultadoVirtual>{
 await exigirRol("organizador");const v=z.object({id:z.union([z.literal(""),z.uuid()]),titulo:z.string().trim().min(3).max(160),consigna:z.string().trim().min(20).max(30000),horas:z.coerce.number().int().min(1).max(168)}).safeParse(Object.fromEntries(f));if(!v.success)return {error:"Completá título, consigna y duración (1 a 168 horas)."};
 const db=await clienteServidor();const r=await db.rpc("guardar_desafio_virtual",{p_id:(v.data.id||null) as string,p_titulo:v.data.titulo,p_consigna:v.data.consigna,p_horas:v.data.horas});if(r.error)return {error:fallo(r.error.message)};refrescar(r.data);if(!v.data.id)redirect(`/organizador/desafios/${r.data}`);return {mensaje:"Consigna guardada."};
}
export async function cambiarEstado(_p:ResultadoVirtual,f:FormData):Promise<ResultadoVirtual>{
 await exigirRol("organizador");const v=z.object({desafio:z.uuid(),estado:z.enum(["borrador","disponible","cerrado"]),confirmar:z.literal("on")}).safeParse(Object.fromEntries(f));if(!v.success)return {error:"Elegí el estado y confirmá el cambio."};const db=await clienteServidor();const r=await db.rpc("estado_desafio_virtual",{p_desafio:v.data.desafio,p_estado:v.data.estado});if(r.error)return {error:fallo(r.error.message)};refrescar(v.data.desafio);return {mensaje:"Estado actualizado. El acceso sigue limitado a las personas habilitadas."};
}
export async function cambiarAcceso(_p:ResultadoVirtual,f:FormData):Promise<ResultadoVirtual>{
 await exigirRol("organizador");const v=z.object({desafio:z.uuid(),usuario:z.uuid(),habilitar:z.enum(["si","no"]),confirmar:z.string().optional()}).safeParse(Object.fromEntries(f));if(!v.success)return {error:"Elegí una persona."};if(v.data.habilitar==="no"&&v.data.confirmar!=="on")return {error:"Confirmá que querés quitarle el acceso."};const db=await clienteServidor();const r=await db.rpc("acceso_desafio_virtual",{p_desafio:v.data.desafio,p_usuario:v.data.usuario,p_habilitar:v.data.habilitar==="si"});if(r.error)return {error:fallo(r.error.message)};refrescar(v.data.desafio);return {mensaje:v.data.habilitar==="si"?"Acceso habilitado para esta persona.":"Acceso quitado. Su entrega se conserva."};
}
export async function guardarDefensa(_p:ResultadoVirtual,f:FormData):Promise<ResultadoVirtual>{
 await exigirRol("organizador");const v=z.object({desafio:z.uuid(),usuario:z.uuid(),fecha:z.string().regex(/^$|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),url:z.union([z.literal(""),z.url().startsWith("https://").max(2000)])}).safeParse(Object.fromEntries(f));if(!v.success)return {error:"Revisá la fecha y el enlace https."};if(v.data.fecha&&!z.iso.datetime({offset:true}).safeParse(`${v.data.fecha}:00-03:00`).success)return {error:"Revisá la fecha de la defensa."};const db=await clienteServidor();const r=await db.rpc("defensa_virtual",{p_desafio:v.data.desafio,p_usuario:v.data.usuario,p_fecha:(v.data.fecha?new Date(`${v.data.fecha}:00-03:00`).toISOString():null) as string,p_url:(v.data.url||null) as string});if(r.error)return {error:fallo(r.error.message)};refrescar(v.data.desafio);return {mensaje:"Datos de la defensa guardados y disponibles para la persona."};
}
export async function guardarRevision(_p:ResultadoVirtual,f:FormData):Promise<ResultadoVirtual>{
 await exigirRol("organizador");const cab=z.object({desafio:z.uuid(),usuario:z.uuid(),confirmar:z.string().optional()}).safeParse(Object.fromEntries(f));if(!cab.success)return {error:"La persona o el desafío no son válidos."};const publicar=f.get("publicar")==="si";if(publicar&&cab.data.confirmar!=="on")return {error:"Confirmá que revisaste la devolución antes de publicarla."};const datos:Record<string,string>={};for(const c of CRITERIOS_VIRTUALES){const v=z.string().trim().max(3000).safeParse(f.get(c.id)??"");if(!v.success)return {error:"Cada observación admite hasta 3.000 caracteres."};datos[c.id]=v.data;}
 const db=await clienteServidor();const r=await db.rpc("revisar_entrega_virtual",{p_desafio:cab.data.desafio,p_usuario:cab.data.usuario,p_datos:datos as Json,p_publicar:publicar});if(r.error)return {error:fallo(r.error.message)};refrescar(cab.data.desafio);return {mensaje:publicar?"Devolución publicada para esta persona.":"Borrador guardado. La versión publicada sigue visible."};
}
