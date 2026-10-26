import { NextResponse, type NextRequest } from "next/server";
import { eventoLanding } from "@/lib/landing/esquemas";
import { registrarEvento } from "@/lib/landing/registro";

// Recibe los eventos de la landing (sendBeacon). Siempre responde 204: el navegador no espera
// nada y un error de medición nunca le tiene que llegar a quien está leyendo la página.
export async function POST(req: NextRequest) {
  try {
    const cuerpo = eventoLanding.safeParse(JSON.parse(await req.text()));
    if (cuerpo.success) await registrarEvento(cuerpo.data);
  } catch (e) {
    console.error("[landing] evento no registrado", e);
  }
  return new NextResponse(null, { status: 204 });
}
