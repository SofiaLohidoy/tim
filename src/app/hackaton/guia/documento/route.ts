import { NextResponse } from "next/server";
import { usuarioActual } from "@/lib/sesion";
import { puedeVerEmpresas } from "@/lib/hackaton/acceso";
import { clienteServidor } from "@/lib/supabase/servidor";

export async function GET(req: Request) {
  const u = await usuarioActual();
  if (!u) return NextResponse.redirect(new URL("/ingresar?siguiente=%2Fhackaton%2Fbienvenida", req.url));
  if (!await puedeVerEmpresas(u)) return new Response("Confirmá tu inscripción con el QR o código para ver los documentos de las empresas.", { status: 403 });
  try {
    const db=await clienteServidor();
    const {data,error}=await db.storage.from("desafios-empresas").download("bienvenida-completa.pdf",{cacheNonce:crypto.randomUUID()},{cache:"no-store"});
    if(error||!data)throw new Error("guia_no_disponible");
    const pdf=await data.arrayBuffer();
    return new Response(new Uint8Array(pdf), { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="bienvenida-hackathon-tim.pdf"',
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return new Response("No pudimos abrir la guía. Probá de nuevo en un momento.", { status: 503 });
  }
}
