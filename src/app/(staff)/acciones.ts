"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirUsuario } from "@/lib/sesion";
import { rubricaDelEvento } from "@/lib/rubrica";
import { dimensionesPara } from "@/lib/devoluciones";

const esquema = z.object({
  equipoId: z.uuid(),
  rol: z.enum(["mentor", "jurado"]),
  estudianteId: z.uuid().nullable(),
  respuestas: z.record(
    z.string(),
    z.object({ nivel: z.uuid().nullable().optional(), obs: z.string().max(600).optional() }),
  ),
  comentario: z.string().max(2000).optional(),
  enviar: z.boolean(),
  /** Plan B en papel: el organizador carga después lo que el evaluador anotó en la rúbrica impresa. */
  diferidaPara: z.uuid().optional(),
});
export type DatosEvaluacion = z.infer<typeof esquema>;
export type ResultadoEvaluacion = { ok: true; estado: "borrador" | "enviada" } | { ok: false; error: string };

/**
 * Guarda (borrador) o envía una evaluación. Lo llama el autoguardado del mentor y del jurado, y
 * la cola de sincronización cuando vuelve la señal. La RLS valida que el evaluador esté asignado
 * a ese equipo y que la persona sea del equipo; acá se valida que las dimensiones y niveles sean
 * de la rúbrica del evento y del rol.
 */
export async function guardarEvaluacion(datos: DatosEvaluacion): Promise<ResultadoEvaluacion> {
  const u = await exigirUsuario();
  const v = esquema.safeParse(datos);
  if (!v.success) return { ok: false, error: "Datos inválidos." };
  const d = v.data;
  if ((d.rol === "mentor") !== (d.estudianteId !== null)) return { ok: false, error: "Objetivo inválido para el rol." };

  const db = await clienteServidor();
  const diferida = Boolean(d.diferidaPara);
  if (diferida && !u.roles.includes("organizador")) return { ok: false, error: "Solo el organizador carga evaluaciones diferidas." };
  const evaluadorId = d.diferidaPara ?? u.id;
  if (diferida) {
    const asignado = await db
      .from("asignaciones")
      .select("id")
      .eq("equipo_id", d.equipoId)
      .eq("evaluador_id", evaluadorId)
      .eq("rol", d.rol)
      .maybeSingle();
    if (!asignado.data) return { ok: false, error: "Esa persona no evalúa a ese equipo con ese rol." };
  }
  const { data: equipo } = await db.from("equipos").select("id, evento_id, eventos(rubrica_id)").eq("id", d.equipoId).maybeSingle();
  if (!equipo) return { ok: false, error: "No tenés asignado ese equipo." };
  const rubrica = await rubricaDelEvento(db, equipo.eventos?.rubrica_id ?? null);
  if (!rubrica) return { ok: false, error: "El evento no tiene rúbrica." };

  const dims = new Set(dimensionesPara(d.rol, rubrica.dimensiones).map((x) => x.id));
  const niveles = new Set(rubrica.niveles.map((n) => n.id));
  const respuestas: Record<string, { nivel: string | null; obs: string }> = {};
  for (const [dim, r] of Object.entries(d.respuestas)) {
    if (!dims.has(dim)) continue;
    if (r.nivel && !niveles.has(r.nivel)) continue;
    respuestas[dim] = { nivel: r.nivel ?? null, obs: (r.obs ?? "").trim() };
  }

  let consulta = db
    .from("evaluaciones")
    .select("id, estado")
    .eq("evaluador_id", evaluadorId)
    .eq("equipo_id", d.equipoId)
    .eq("objetivo", d.rol === "mentor" ? "persona" : "equipo");
  consulta = d.estudianteId ? consulta.eq("estudiante_id", d.estudianteId) : consulta.is("estudiante_id", null);
  const existente = await consulta.maybeSingle();

  // Una vez enviada, sigue enviada aunque se corrija (hasta que se publiquen las devoluciones).
  const estado = d.enviar || existente.data?.estado === "enviada" ? "enviada" : "borrador";
  const fila = {
    evento_id: equipo.evento_id,
    equipo_id: d.equipoId,
    rubrica_id: rubrica.id,
    evaluador_id: evaluadorId,
    rol_evaluador: d.rol,
    objetivo: d.rol === "mentor" ? "persona" : "equipo",
    estudiante_id: d.estudianteId,
    respuestas,
    comentario: d.comentario?.trim() || null,
    estado,
    ...(diferida ? { carga: "diferida", cargada_por: u.id } : {}),
    ...(d.enviar ? { enviada_en: new Date().toISOString() } : {}),
  };

  const r = existente.data
    ? await db.from("evaluaciones").update(fila).eq("id", existente.data.id)
    : await db.from("evaluaciones").insert(fila);
  if (r.error) {
    console.error("[evaluacion]", r.error.code, r.error.message);
    return {
      ok: false,
      error:
        r.error.code === "42501"
          ? "No se puede guardar: o no tenés asignado este equipo, o las devoluciones ya se publicaron."
          : "No pudimos guardar. Lo reintentamos solo.",
    };
  }
  if (d.enviar) revalidatePath(d.rol === "mentor" ? "/mentor" : "/jurado", "layout");
  return { ok: true, estado };
}
