import {NextResponse} from "next/server";
import {revalidatePath} from "next/cache";
import {z} from "zod";
import {usuarioActual} from "@/lib/sesion";
import {clienteServidor} from "@/lib/supabase/servidor";
export async function POST(req:Request){
 const error=(s:string,status=400)=>NextResponse.json({error:s},{status});
 if(req.headers.get("origin")!==new URL(req.url).origin)return error("Entrá desde TIM para subir archivos.",403);
 const u=await usuarioActual();if(!u)return error("Entrá con tu cuenta.",401);
 if(Number(req.headers.get("content-length"))>4194304+65536)return error("El archivo supera los 4 MB.",413);
 let form:FormData;try{form=await req.formData();}catch{return error("No pudimos leer el archivo.");}
 const id=z.uuid().safeParse(form.get("desafio")),tipo=z.enum(["consigna","investigacion"]).safeParse(form.get("tipo"));const f=form.get("archivo");
 if(!id.success||!tipo.success||!(f instanceof File)||f.size<1||f.size>4194304||f.name.length>200)return error("Elegí un archivo de hasta 4 MB.");
 const ext=f.name.split(".").pop()?.toLowerCase();const mimes:Record<string,string>={pdf:"application/pdf",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",md:"text/markdown"};
 if(!ext||!mimes[ext]||(tipo.data==="consigna"&&ext!=="pdf"))return error("Usá PDF para la consigna; PDF, DOCX o MD para la investigación.");
 const bytes=new Uint8Array(await f.arrayBuffer());if((ext==="pdf"&&new TextDecoder().decode(bytes.slice(0,5))!=="%PDF-")||(ext==="docx"&&(bytes[0]!==80||bytes[1]!==75)))return error("El archivo no coincide con su extensión.");
 if(ext==="md"){try{new TextDecoder("utf-8",{fatal:true}).decode(bytes);}catch{return error("El archivo Markdown debe ser texto UTF-8.");}}
 const ruta=`${id.data}/${tipo.data==="consigna"?"consigna":u.id}/${crypto.randomUUID()}.${ext}`;const db=await clienteServidor();
 const puede=await db.rpc("puede_subir_virtual",{p_ruta:ruta});if(puede.data!==true)return error("No tenés permiso para subir este archivo, el plazo terminó o la entrega ya fue enviada.",403);
 const storage=db.storage.from("desafios-virtuales");const subida=await storage.upload(ruta,bytes,{contentType:mimes[ext],cacheControl:"0"});if(subida.error)return error("No pudimos subir el archivo. Probá de nuevo.",503);
 const r=await db.rpc("registrar_archivo_virtual",{p_desafio:id.data,p_ruta:ruta,p_nombre:f.name,p_mime:mimes[ext],p_tamano:f.size,p_tipo:tipo.data});
 if(r.error){await storage.remove([ruta]);return error("No pudimos registrar el archivo. Revisá si la entrega sigue abierta.");}
 revalidatePath(`/desafios/${id.data}`);revalidatePath(`/organizador/desafios/${id.data}`);
 return NextResponse.json({ok:true,id:r.data});
}
