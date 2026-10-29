import { NextResponse } from "next/server";
import { z } from "zod";
import { usuarioActual } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";

export async function GET(req: Request, ctx: RouteContext<"/entregas/[equipo]">) {
  if (!await usuarioActual()) return NextResponse.redirect(new URL("/ingresar",req.url));
  const {equipo} = await ctx.params;
  if (!z.uuid().safeParse(equipo).success) return new Response("No encontramos la entrega.",{status:404});
  const db = await clienteServidor();
  const tipo=z.enum(["documento","presentacion"]).safeParse(new URL(req.url).searchParams.get("tipo")??"documento");
  if(!tipo.success)return new Response("No encontramos la entrega.",{status:404});
  const {data} = await db.from(tipo.data==="documento"?"entregas_equipo":"presentaciones_equipo").select("archivo_path").eq("equipo_id",equipo).maybeSingle();
  if (!data) return new Response("No encontramos una entrega disponible para tu cuenta.",{status:404});
  const firmado = await db.storage.from("entregas").createSignedUrl(data.archivo_path,120,{download:true});
  if (firmado.error || !firmado.data) return new Response("No pudimos abrir la entrega. Probá de nuevo.",{status:404});
  return NextResponse.redirect(firmado.data.signedUrl, {headers:{"Cache-Control":"private, no-store"}});
}
