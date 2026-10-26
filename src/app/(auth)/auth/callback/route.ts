import { NextResponse, type NextRequest } from "next/server";
import { clienteServidor } from "@/lib/supabase/servidor";
import { destinoSeguro } from "@/lib/sesion";

// Vuelta de Google: cambia el código por una sesión y sigue a /continuar.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const s = destinoSeguro(req.nextUrl.searchParams.get("siguiente"));
  if (code) {
    const db = await clienteServidor();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(`/continuar${s ? `?siguiente=${encodeURIComponent(s)}` : ""}`, req.url));
    }
    console.error("[auth] callback", error.code, error.message);
  }
  return NextResponse.redirect(new URL("/ingresar?error=google", req.url));
}
