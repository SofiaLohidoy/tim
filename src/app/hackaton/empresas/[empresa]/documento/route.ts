import { NextResponse } from "next/server";
import { usuarioActual } from "@/lib/sesion";
import { puedeVerEmpresas } from "@/lib/hackaton/acceso";
import { clienteServidor } from "@/lib/supabase/servidor";
import DOCUMENTOS from "@/lib/hackaton/documentos.json";


export async function GET(req: Request, ctx: RouteContext<"/hackaton/empresas/[empresa]/documento">) {
  const { empresa } = await ctx.params;
  // Lista cerrada: ningún parámetro del visitante se convierte en una ruta de disco.
  const documento=Object.hasOwn(DOCUMENTOS,empresa)?DOCUMENTOS[empresa as keyof typeof DOCUMENTOS]:null;
  if (!documento) return new Response("El documento todavía no está disponible.", { status: 404 });
  const u = await usuarioActual();
  if (!u) return NextResponse.redirect(new URL("/ingresar?siguiente=%2Fhackaton%2Fbienvenida", req.url));
  if (!await puedeVerEmpresas(u)) {
    return new Response("Confirmá tu inscripción con el QR o código para consultar los documentos de la hackatón.", { status: 403 });
  }
  try {
    const db=await clienteServidor();
    // SDK y RLS: https://supabase.com/docs/reference/javascript/storage-from-download
    const {data,error}=await db.storage.from("desafios-empresas").download(documento.archivo,{cacheNonce:crypto.randomUUID()},{cache:"no-store"});
    if(error||!data)throw new Error("documento_no_disponible");
    const pdf=await data.arrayBuffer();
    return new Response(new Uint8Array(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":`inline; filename="${documento.nombre}"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  } catch {
    return new Response("No pudimos abrir el documento. Probá de nuevo en un momento.", {status:503});
  }
}
