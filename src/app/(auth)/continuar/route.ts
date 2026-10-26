import { NextResponse, type NextRequest } from "next/server";
import { destinoTrasIngreso, usuarioActual } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";
import { resolverDestino } from "@/lib/destino";

// Después de entrar: a la pantalla que corresponde según el rol, o a donde venía (ej. el QR de
// asistencia). El estudiante sin onboarding pasa primero por /bienvenida.
export async function GET(req: NextRequest) {
  const u = await usuarioActual();
  if (!u) return NextResponse.redirect(new URL("/ingresar", req.url));
  const destino = destinoTrasIngreso(u, req.nextUrl.searchParams.get("siguiente"));
  return NextResponse.redirect(new URL(await resolverDestino(await clienteServidor(), u, destino), req.url));
}
