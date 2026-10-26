import "server-only";
import { createHash } from "node:crypto";
import { headers, cookies } from "next/headers";
import { clienteServicio } from "@/lib/supabase/servicio";
import { esVariante } from "@/app/(landing)/variantes";
import type { EventoLanding, Interes, Origen } from "./esquemas";

// Límites del rate limit, por visitante y por IP. Por visitante: generoso para una persona real
// (scroll por 8 secciones, varios clics), corto para un script. Por IP: alto, porque un aula o la
// hackatón entera sale a internet con la misma IP y no se puede perder esa medición.
const EVENTOS_POR_MINUTO = { visitante: 60, ip: 1200 };
const REGISTROS_POR_HORA = { visitante: 5, ip: 120 };

async function excede(
  db: ReturnType<typeof clienteServicio>,
  tabla: "eventos_landing" | "interesados",
  desde: string,
  visitanteId: string,
  ipHash: string,
  limite: { visitante: number; ip: number },
) {
  const [porVisitante, porIp] = await Promise.all([
    db.from(tabla).select("id", { count: "exact", head: true }).eq("visitante_id", visitanteId).gte("creado_en", desde),
    db.from(tabla).select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("creado_en", desde),
  ]);
  return (porVisitante.count ?? 0) >= limite.visitante || (porIp.count ?? 0) >= limite.ip;
}

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
  if (await excede(db, "eventos_landing", haceUnMinuto, visitanteId, ipHash, EVENTOS_POR_MINUTO)) return "limitado";

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
  if (await excede(db, "interesados", haceUnaHora, visitanteId, ipHash, REGISTROS_POR_HORA)) return "limitado";

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
