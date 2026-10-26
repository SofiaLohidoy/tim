import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipos";
import { nombreDe } from "@/lib/eventos";

type Db = SupabaseClient<Database>;

export type Persona = { id: string; email: string; nombre: string };

/** Todo lo que el organizador necesita del evento en una pasada. Volúmenes chicos: se arma en memoria. */
export async function estadoDelEvento(db: Db, eventoId: string) {
  const [equipos, miembros, asignaciones, asistencias, evaluaciones, estudiantes, roles, invitaciones, devoluciones, encuestas] =
    await Promise.all([
      db.from("equipos").select("id, nombre, entrega_url").eq("evento_id", eventoId).order("nombre"),
      db.from("miembros_equipo").select("equipo_id, usuario_id").eq("evento_id", eventoId),
      db.from("asignaciones").select("id, equipo_id, evaluador_id, rol").eq("evento_id", eventoId),
      db.from("asistencias").select("usuario_id, metodo, creado_en").eq("evento_id", eventoId),
      db.from("evaluaciones").select("id, equipo_id, evaluador_id, rol_evaluador, objetivo, estudiante_id, estado, carga, actualizado_en").eq("evento_id", eventoId),
      db.from("estudiantes").select("usuario_id, universidad, carrera, onboarding_completo_en, cv_path"),
      db.from("roles_usuario").select("id, usuario_id, rol, evento_id"),
      db.from("invitaciones").select("id, email, nombre, rol, evento_id, equipo_id, usada_en, creado_en, token").order("creado_en", { ascending: false }),
      db.from("devoluciones").select("estudiante_id, publicada_en, abierta_en").eq("evento_id", eventoId),
      db.from("respuestas_encuesta").select("usuario_id, respuestas").eq("evento_id", eventoId),
    ]);

  const ids = new Set<string>([
    ...(estudiantes.data ?? []).map((e) => e.usuario_id),
    ...(roles.data ?? []).map((r) => r.usuario_id),
  ]);
  const perfiles = ids.size
    ? await db.from("perfiles").select("id, email, nombre, apellido").in("id", [...ids])
    : { data: [] as { id: string; email: string; nombre: string | null; apellido: string | null }[] };
  const persona = new Map<string, Persona>(
    (perfiles.data ?? []).map((p) => [p.id, { id: p.id, email: p.email, nombre: nombreDe(p) }]),
  );

  return {
    equipos: equipos.data ?? [],
    miembros: miembros.data ?? [],
    asignaciones: asignaciones.data ?? [],
    asistencias: asistencias.data ?? [],
    evaluaciones: evaluaciones.data ?? [],
    estudiantes: (estudiantes.data ?? []).filter((e) => e.onboarding_completo_en),
    roles: roles.data ?? [],
    invitaciones: invitaciones.data ?? [],
    devoluciones: devoluciones.data ?? [],
    encuestas: encuestas.data ?? [],
    persona,
  };
}

export type EstadoEvento = Awaited<ReturnType<typeof estadoDelEvento>>;

/** Completitud de evaluaciones: lo esperado (persona por mentor, equipo por jurado) contra lo enviado. */
export function completitud(e: EstadoEvento) {
  const porEvaluador = new Map<string, { rol: "mentor" | "jurado"; esperadas: number; enviadas: number; borradores: number; equipos: string[] }>();
  for (const a of e.asignaciones) {
    const rol = a.rol as "mentor" | "jurado";
    const k = `${a.evaluador_id}:${rol}`;
    const fila = porEvaluador.get(k) ?? { rol, esperadas: 0, enviadas: 0, borradores: 0, equipos: [] };
    const objetivos =
      rol === "mentor" ? e.miembros.filter((m) => m.equipo_id === a.equipo_id).map((m) => m.usuario_id) : [null];
    fila.esperadas += objetivos.length;
    fila.equipos.push(e.equipos.find((x) => x.id === a.equipo_id)?.nombre ?? "");
    for (const o of objetivos) {
      const ev = e.evaluaciones.find(
        (x) => x.evaluador_id === a.evaluador_id && x.equipo_id === a.equipo_id && x.rol_evaluador === rol && x.estudiante_id === o,
      );
      if (ev?.estado === "enviada") fila.enviadas++;
      else if (ev) fila.borradores++;
    }
    porEvaluador.set(k, fila);
  }
  const filas = [...porEvaluador.entries()].map(([k, v]) => ({ evaluadorId: k.split(":")[0], ...v }));
  const esperadas = filas.reduce((s, f) => s + f.esperadas, 0);
  const enviadas = filas.reduce((s, f) => s + f.enviadas, 0);
  return { filas, esperadas, enviadas, porcentaje: esperadas ? Math.round((enviadas / esperadas) * 100) : 0 };
}
