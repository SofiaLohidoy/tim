import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipos";
import type { ContenidoDevolucion } from "@/lib/devoluciones";
import { actividad } from "@/lib/actividades/catalogo";

type Db = SupabaseClient<Database>;

export type PerfilTim = {
  eventos: { evento: string; fecha: string; contenido: ContenidoDevolucion }[];
  partidas: number;
  resueltas: number;
  porActividad: { titulo: string; jugadas: number; resueltas: number }[];
  senales: Record<"persistencia" | "uso_de_informacion" | "autocorreccion", { valor: number; detalle: Record<string, unknown>; fecha: string }[]>;
  credencial: { token: string; creado_en: string } | null;
};

/** Todo lo que se acumuló en el perfil de una persona: evidencia de eventos, actividades y señales. */
export async function perfilTim(db: Db, usuarioId: string): Promise<PerfilTim> {
  const [devs, partidas, senales, cred] = await Promise.all([
    db.from("devoluciones").select("contenido, eventos(nombre, fecha)").eq("estudiante_id", usuarioId).not("publicada_en", "is", null),
    db.from("partidas").select("actividad, resultado").eq("usuario_id", usuarioId).neq("resultado", "en_curso"),
    db.from("senales").select("clave, valor, detalle, creado_en").eq("usuario_id", usuarioId).order("creado_en"),
    db.from("credenciales").select("token, creado_en").eq("usuario_id", usuarioId).is("revocada_en", null).order("creado_en", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const porActividad = new Map<string, { titulo: string; jugadas: number; resueltas: number }>();
  for (const p of partidas.data ?? []) {
    const fila = porActividad.get(p.actividad) ?? { titulo: actividad(p.actividad)?.titulo ?? p.actividad, jugadas: 0, resueltas: 0 };
    fila.jugadas++;
    if (p.resultado === "resuelta") fila.resueltas++;
    porActividad.set(p.actividad, fila);
  }
  const s: PerfilTim["senales"] = { persistencia: [], uso_de_informacion: [], autocorreccion: [] };
  for (const x of senales.data ?? []) {
    s[x.clave as keyof typeof s]?.push({ valor: Number(x.valor), detalle: x.detalle as Record<string, unknown>, fecha: x.creado_en });
  }

  return {
    eventos: (devs.data ?? [])
      .map((d) => ({ evento: d.eventos?.nombre ?? "", fecha: d.eventos?.fecha ?? "", contenido: d.contenido as unknown as ContenidoDevolucion }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    partidas: (partidas.data ?? []).length,
    resueltas: (partidas.data ?? []).filter((p) => p.resultado === "resuelta").length,
    porActividad: [...porActividad.values()],
    senales: s,
    credencial: cred.data ?? null,
  };
}

/** Lo que vio el mentor de la persona en cada dimensión (el nivel más alto si hubo más de un mentor). */
export function nivelesIndividuales(c: ContenidoDevolucion) {
  return c.dimensiones
    .map((d) => {
      const obs = [...d.individual, ...d.equipo].filter((o) => o.orden);
      const mejor = obs.sort((a, b) => (b.orden ?? 0) - (a.orden ?? 0))[0];
      return mejor ? { dimension: d.nombre, nivel: mejor.nivel!, orden: mejor.orden!, quien: mejor.quien } : null;
    })
    .filter((x) => x !== null);
}

/** Link "Agregar a LinkedIn" (Add to Profile, https://addtoprofile.linkedin.com, verificado 26/10/2026). */
export function linkLinkedin(p: { url: string; token: string; emitida: string }) {
  const f = new Date(p.emitida);
  const q = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: "Perfil TIM: evidencia de habilidades blandas",
    organizationName: "TIM",
    issueYear: String(f.getFullYear()),
    issueMonth: String(f.getMonth() + 1),
    certUrl: p.url,
    certId: p.token.slice(0, 8).toUpperCase(),
  });
  return `https://www.linkedin.com/profile/add?${q.toString()}`;
}
