import { NextResponse, type NextRequest } from "next/server";
import { clienteServidor } from "@/lib/supabase/servidor";
import { usuarioActual } from "@/lib/sesion";
import { resolverDestino } from "@/lib/destino";

// Destino del QR de asistencia que proyecta el organizador: /a/<codigo>.
// Sin sesión, pasa por el registro y vuelve acá. Con sesión, marca "estuve ahí" y sigue al
// inicio (o al onboarding, si todavía no lo hizo). Marcar dos veces no hace nada.
export async function GET(req: NextRequest, ctx: RouteContext<"/a/[codigo]">) {
  const { codigo } = await ctx.params;
  const u = await usuarioActual();
  if (!u) {
    return NextResponse.redirect(new URL(`/ingresar?origen=qr&siguiente=${encodeURIComponent(`/a/${codigo}`)}`, req.url));
  }
  const db = await clienteServidor();
  return NextResponse.redirect(new URL(await resolverDestino(db, u, `/a/${codigo}`), req.url));
}
