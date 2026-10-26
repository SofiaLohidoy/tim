import "server-only";
import { createHash } from "node:crypto";
import { headers, cookies } from "next/headers";
import { clienteServicio } from "@/lib/supabase/servicio";
import { esVariante } from "@/app/(landing)/variantes";
import type { EventoLanding, Interes, Origen } from "./esquemas";

// Límites del rate limit. Generosos para una persona real (scroll por 8 secciones, varios clics),
// cortos para un script.
const MAX_EVENTOS_POR_MINUTO = 90;
const MAX_REGISTROS_POR_HORA = 8;

export async function contextoVisitante() {
  const h = await headers();
  const c = await cookies();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || h.get("x-real-ip") || "sin-ip";
  const sal = process.env.LANDING_SAL ?? "tim";
  const variante = c.get("tim_var")?.value;
  return {
    ipHash: createHash("sha256").update(`${sal}:${ip}`).digest("hex").slice(0, 32),
    visitanteId: c.get("tim_vid")?.value ?? "sin-cookie",
    variante: esVariante(variante) ? variante : null,
  };
}

export async function registrarEvento(evento: EventoLanding): Promise<"ok" | "limitado"> {
  const { ipHash, visitanteId, variante } = await contextoVisitante();
  const db = clienteServicio();
  const haceUnMinuto = new Date(Date.now() - 60_000).toISOString();
  const { count } = await db
    .from("eventos_landing")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("creado_en", haceUnMinuto);
  if ((count ?? 0) >= MAX_EVENTOS_POR_MINUTO) return "limitado";

  const { error } = await db.from("eventos_landing").insert({
    visitante_id: visitanteId,
    tipo: evento.tipo,
    detalle: evento.detalle ?? null,
    variante,
    origen: evento.origen ?? {},
    ip_hash: ipHash,
  });
  if (error) throw new Error(`eventos_landing: ${error.message}`);
  return "ok";
}

export async function registrarInteresado(datos: Interes, origen: Origen): Promise<"ok" | "limitado"> {
  const { ipHash, visitanteId, variante } = await contextoVisitante();
  const db = clienteServicio();
  const haceUnaHora = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await db
    .from("interesados")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("creado_en", haceUnaHora);
  if ((count ?? 0) >= MAX_REGISTROS_POR_HORA) return "limitado";

  const { audiencia, email, ...resto } = datos;
  const { error } = await db.from("interesados").upsert(
    {
      audiencia,
      email: email.toLowerCase(),
      datos: resto,
      variante,
      origen,
      visitante_id: visitanteId,
      ip_hash: ipHash,
    },
    { onConflict: "audiencia,email" },
  );
  if (error) throw new Error(`interesados: ${error.message}`);
  await registrarEvento({ tipo: "form_fin", detalle: audiencia, origen });
  return "ok";
}
