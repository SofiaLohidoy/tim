"use server";
import {z} from "zod";
import {revalidatePath} from "next/cache";
import {exigirUsuario} from "@/lib/sesion";
import {clienteServidor} from "@/lib/supabase/servidor";
import {entregaVirtual} from "@/lib/desafios-virtuales";
import type {Json} from "@/lib/supabase/tipos";
import type {ResultadoVirtual} from "@/components/app/formulario-virtual";
function refrescar(id:string){revalidatePath(`/desafios/${id}`);revalidatePath(`/organizador/desafios/${id}`);revalidatePath("/actividades");}
export async function comenzarDesafio(_p:ResultadoVirtual,f:FormData):Promise<ResultadoVirtual>{
 await exigirUsuario();const v=z.uuid().safeParse(f.get("desafio"));if(!v.success)return {error:"El desafío no es válido."};const db=await clienteServidor();const r=await db.rpc("comenzar_virtual",{p_desafio:v.data});if(r.error)return {error:"Este desafío no está disponible para comenzar. Consultá con organización."};refrescar(v.data);return {mensaje:"Comenzaste. Tu fecha límite quedó guardada."};
}
export async function guardarEntrega(_p:ResultadoVirtual,f:FormData):Promise<ResultadoVirtual>{
 await exigirUsuario();const id=z.uuid().safeParse(f.get("desafio"));const v=entregaVirtual.safeParse(Object.fromEntries(f));if(!id.success||!v.success)return {error:"Revisá los enlaces https y la extensión de los textos."};const enviar=f.get("enviar")==="si";if(enviar&&f.get("confirmar")!=="on")return {error:"Confirmá que revisaste la entrega antes de enviarla."};const db=await clienteServidor();const r=await db.rpc("guardar_entrega_virtual",{p_desafio:id.data,p_datos:v.data as Json,p_enviar:enviar});if(r.error)return {error:r.error.message.includes("entrega_incompleta")?"Para enviar, elegí la integración, agregá investigación (archivo o enlace), repositorio, video y al menos 20 caracteres sobre tus decisiones.":r.error.message.includes("entrega_cerrada")?"El plazo terminó o la entrega ya fue enviada. Tu borrador se conserva.":"No pudimos guardar. Confirmá con organización que seguís teniendo acceso."};refrescar(id.data);return {mensaje:enviar?"Entrega enviada. Organización ya puede revisarla.":"Borrador guardado."};
}
