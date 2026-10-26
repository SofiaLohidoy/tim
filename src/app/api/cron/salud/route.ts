import { NextResponse, type NextRequest } from "next/server";
import { clienteServicio } from "@/lib/supabase/servicio";

// Supabase Free pausa el proyecto tras 7 días sin actividad. Vercel llama esto una vez por día
// (vercel.json) con un select real para mantenerlo despierto. Responde el estado, sin datos.
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const { error } = await clienteServicio().from("eventos").select("id", { head: true, count: "exact" });
  if (error) {
    console.error("[salud]", error.message);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true, en: new Date().toISOString() });
}
