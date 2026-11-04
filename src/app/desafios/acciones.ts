"use server";
import {z} from "zod";
import {revalidatePath} from "next/cache";
import {exigirUsuario} from "@/lib/sesion";
import {clienteServidor} from "@/lib/supabase/servidor";
import {validarEntregaVirtual,FALTANTES_ENTREGA,type ResultadoEntregaVirtual} from "@/lib/desafios-virtuales";
import type {Json} from "@/lib/supabase/tipos";
import type {ResultadoVirtual} from "@/components/app/formulario-virtual";
function refrescar(id:string){revalidatePath(`/desafios/${id}`);revalidatePath(`/organizador/desafios/${id}`);revalidatePath("/actividades");}
export async function comenzarDesafio(_p:ResultadoVirtual,f:FormData):Promise<ResultadoVirtual>{
 await exigirUsuario();const v=z.uuid().safeParse(f.get("desafio"));if(!v.success)return {error:"El desafío no es válido."};const db=await clienteServidor();const r=await db.rpc("comenzar_virtual",{p_desafio:v.data});if(r.error)return {error:"Este desafío no está disponible para comenzar. Consultá con organización."};refrescar(v.data);return {mensaje:"Comenzaste. Tu fecha límite quedó guardada."};
}
export async function guardarEntrega(_p:ResultadoEntregaVirtual,f:FormData):Promise<ResultadoEntregaVirtual>{
 const usuario=await exigirUsuario();const id=z.uuid().safeParse(f.get("desafio"));if(!id.success)return {error:"El desafío no es válido."};const db=await clienteServidor();
 const p=await db.from("participaciones_virtuales").select("investigacion_id").eq("desafio_id",id.data).eq("usuario_id",usuario.id).maybeSingle();
 if(p.error||!p.data)return {error:"No pudimos consultar tu entrega. Recargá la página y probá de nuevo."};
 const enviar=f.get("enviar")==="si";const v=validarEntregaVirtual(Object.fromEntries(f),Boolean(p.data.investigacion_id),enviar);
 if(!v.datos||Object.keys(v.errores).length)return {error:"Revisá los entregables marcados.",errores:v.errores};
 if(enviar&&f.get("confirmar")!=="on")return {error:"Confirmá que revisaste la entrega antes de enviarla.",errores:{confirmar:"Confirmá que revisaste la entrega antes de enviarla."}};
 const r=await db.rpc("guardar_entrega_virtual",{p_desafio:id.data,p_datos:v.datos as Json,p_enviar:enviar});
 if(r.error){const faltas={informe:"investigacion_url",repositorio:"repo_url",plataforma:"demo_url",video:"video_url"} as const;for(const [codigo,campo] of Object.entries(faltas)){if(r.error.message.includes(`entrega_incompleta_${codigo}`))return {error:"Revisá los entregables marcados.",errores:{[campo]:FALTANTES_ENTREGA[campo]}};}return {error:r.error.message.includes("entrega_cerrada")?"El plazo terminó o la entrega ya fue enviada. Tu borrador se conserva.":"No pudimos guardar. Confirmá con organización que seguís teniendo acceso."};}
 refrescar(id.data);return {mensaje:enviar?"Entrega enviada. Organización ya puede revisarla.":"Borrador guardado."};
}
