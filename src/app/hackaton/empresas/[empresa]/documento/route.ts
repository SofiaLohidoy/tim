import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { usuarioActual } from "@/lib/sesion";
import { puedeVerEmpresas } from "@/lib/hackaton/acceso";

export async function GET(req: Request, ctx: RouteContext<"/hackaton/empresas/[empresa]/documento">) {
  const { empresa } = await ctx.params;
  // Lista cerrada: ningún parámetro del visitante se convierte en una ruta de disco.
  if (empresa !== "v-go") return new Response("El documento todavía no está disponible.", { status: 404 });
  const u = await usuarioActual();
  if (!u) return NextResponse.redirect(new URL("/ingresar?siguiente=%2Fhackaton%2Fbienvenida", req.url));
  if (!await puedeVerEmpresas(u)) {
    return new Response("Confirmá tu inscripción con el QR o código para consultar los documentos de la hackatón.", { status: 403 });
  }
  try {
    const pdf=await readFile(join(process.cwd(),"src/contenidos/hackaton/v-go.pdf"));
    return new Response(new Uint8Array(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":'inline; filename="VGo_Propuesta_1_Restaurantes.pdf"',"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  } catch {
    return new Response("No pudimos abrir el documento. Probá de nuevo en un momento.", {status:503});
  }
}
