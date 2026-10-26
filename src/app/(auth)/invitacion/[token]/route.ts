import { NextResponse, type NextRequest } from "next/server";
import { clienteServidor } from "@/lib/supabase/servidor";
import { usuarioActual } from "@/lib/sesion";
import { resolverDestino } from "@/lib/destino";

// Link personal de invitación de staff (mentor, jurado, organizador). Ver migración 007: con mail
// y contraseña el rol se aplica solo acá, logueado con el mail invitado.
export async function GET(req: NextRequest, ctx: RouteContext<"/invitacion/[token]">) {
  const { token } = await ctx.params;
  const db = await clienteServidor();
  const u = await usuarioActual();
  if (!u) {
    const { data: email } = await db.rpc("mail_de_invitacion", { p_token: token });
    const url = new URL("/ingresar", req.url);
    url.searchParams.set("siguiente", `/invitacion/${token}`);
    url.searchParams.set("invitacion", "1");
    if (email) url.searchParams.set("email", email);
    return NextResponse.redirect(url);
  }
  return NextResponse.redirect(new URL(await resolverDestino(db, u, `/invitacion/${token}`), req.url));
}
