import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { usuarioActual } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";
import { clienteServicio } from "@/lib/supabase/servicio";
import { MAX_ENTREGA, TIPOS_ENTREGA } from "@/lib/entregas";

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin || origin !== new URL(req.url).origin) return NextResponse.json({error:"Entrá desde TIM para subir la entrega."},{status:403});
  const u = await usuarioActual();
  if (!u) return NextResponse.json({error:"Entrá con tu cuenta para subir la entrega."},{status:401});
  if (Number(req.headers.get("content-length")) > MAX_ENTREGA + 65536) return NextResponse.json({error:"El archivo supera los 4 MB."},{status:413});
  const form = await req.formData();
  const equipo = z.uuid().safeParse(form.get("equipo"));
  const archivo = form.get("archivo");
  if (!equipo.success || !(archivo instanceof File) || !TIPOS_ENTREGA[archivo.type] || archivo.size<1 || archivo.size>MAX_ENTREGA || archivo.name.length>180)
    return NextResponse.json({error:"Elegí un PDF, PowerPoint o Word de hasta 4 MB."},{status:400});
  const db = await clienteServidor();
  const miembro = await db.from("miembros_equipo").select("usuario_id").eq("equipo_id",equipo.data).eq("usuario_id",u.id).maybeSingle();
  if (!miembro.data) return NextResponse.json({error:"Solo los integrantes pueden subir la entrega de su equipo."},{status:403});
  const anterior = await db.from("entregas_equipo").select("archivo_path").eq("equipo_id",equipo.data).maybeSingle();
  const ruta = `${equipo.data}/${crypto.randomUUID()}.${TIPOS_ENTREGA[archivo.type]}`;
  const storage = clienteServicio().storage.from("entregas");
  const subido = await storage.upload(ruta,archivo,{contentType:archivo.type});
  if (subido.error) return NextResponse.json({error:"No pudimos subir el archivo. Probá de nuevo."},{status:500});
  const guardado = await db.rpc("guardar_archivo_entrega",{p_equipo:equipo.data,p_ruta:ruta,p_nombre:archivo.name,p_tipo:archivo.type,p_tamano:archivo.size});
  if (guardado.error) {
    await storage.remove([ruta]);
    return NextResponse.json({error:guardado.error.message.includes("evento_cerrado") ? "El evento ya cerró sus entregas." : "No pudimos guardar la entrega. Probá de nuevo."},{status:400});
  }
  if (anterior.data?.archivo_path) await storage.remove([anterior.data.archivo_path]);
  revalidatePath("/inicio");revalidatePath("/organizador","layout");revalidatePath("/jurado","layout");
  return NextResponse.json({ok:true});
}
