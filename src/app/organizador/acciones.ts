"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clienteServidor } from "@/lib/supabase/servidor";
import { clienteServicio } from "@/lib/supabase/servicio";
import { exigirRol } from "@/lib/sesion";
import { nuevoCodigo } from "@/lib/codigo";
import { rubricaDelEvento } from "@/lib/rubrica";
import { armarDevolucion, type EvaluacionEnviada } from "@/lib/devoluciones";

// Todas las acciones exigen organizador. La RLS lo vuelve a exigir en la base: si alguien llama
// la acción sin el rol, la escritura igual falla.

export type Resultado = { ok?: boolean; error?: string; mensaje?: string };

function refrescar() {
  revalidatePath("/organizador", "layout");
}

const evento = z.object({
  id: z.uuid().optional(),
  nombre: z.string().trim().min(3, "Poné un nombre de al menos 3 letras.").max(120),
  fecha: z.iso.date("Elegí la fecha."),
  lugar: z.string().trim().max(200).optional(),
  estado: z.enum(["preparacion", "en_curso", "cerrado"]).optional(),
});

export async function guardarEvento(_p: Resultado, form: FormData): Promise<Resultado> {
  await exigirRol("organizador");
  const v = evento.safeParse(Object.fromEntries(form));
  if (!v.success) return { error: v.error.issues[0]?.message };
  const db = await clienteServidor();
  const { id, ...datos } = v.data;
  if (id) {
    const { error } = await db.from("eventos").update({ ...datos, lugar: datos.lugar || null }).eq("id", id);
    if (error) return { error: "No pudimos guardar el evento." };
  } else {
    const plantilla = await rubricaDelEvento(db, null);
    const { data, error } = await db
      .from("eventos")
      .insert({ ...datos, lugar: datos.lugar || null, rubrica_id: plantilla?.id ?? null })
      .select("id")
      .single();
    if (error || !data) return { error: "No pudimos crear el evento." };
    await db.from("codigos_asistencia").insert({ evento_id: data.id, codigo: nuevoCodigo() });
  }
  refrescar();
  return { ok: true, mensaje: "Evento guardado." };
}

const desafio = z.object({
  eventoId: z.uuid(),
  titulo: z.string().trim().min(3, "Falta el título.").max(160),
  consigna: z.string().trim().min(10, "Falta la consigna.").max(6000),
  estado: z.enum(["borrador", "publicado"]),
});

export async function guardarDesafio(_p: Resultado, form: FormData): Promise<Resultado> {
  await exigirRol("organizador");
  const v = desafio.safeParse(Object.fromEntries(form));
  if (!v.success) return { error: v.error.issues[0]?.message };
  const db = await clienteServidor();
  const existente = await db.from("desafios").select("id").eq("evento_id", v.data.eventoId).maybeSingle();
  const fila = { evento_id: v.data.eventoId, titulo: v.data.titulo, consigna: v.data.consigna, estado: v.data.estado };
  const r = existente.data
    ? await db.from("desafios").update(fila).eq("id", existente.data.id)
    : await db.from("desafios").insert(fila);
  if (r.error) return { error: "No pudimos guardar el desafío." };
  refrescar();
  return { ok: true, mensaje: v.data.estado === "publicado" ? "Desafío publicado: ya lo ven los estudiantes." : "Borrador guardado." };
}

export async function rotarCodigo(eventoId: string): Promise<{ codigo?: string; error?: string }> {
  await exigirRol("organizador");
  const db = await clienteServidor();
  const actual = await db.from("codigos_asistencia").select("codigo").eq("evento_id", eventoId).maybeSingle();
  const codigo = nuevoCodigo();
  const { error } = await db.from("codigos_asistencia").upsert({
    evento_id: eventoId,
    codigo,
    codigo_anterior: actual.data?.codigo ?? null,
    rotado_en: new Date().toISOString(),
  });
  if (error) return { error: "No pudimos rotar el código." };
  return { codigo };
}

export async function crearEquipos(eventoId: string, cantidad: number): Promise<Resultado> {
  await exigirRol("organizador");
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 40) return { error: "Elegí entre 1 y 40 equipos." };
  const db = await clienteServidor();
  const { data: existentes } = await db.from("equipos").select("nombre").eq("evento_id", eventoId);
  const usados = new Set((existentes ?? []).map((e) => e.nombre));
  const nuevos: { evento_id: string; nombre: string }[] = [];
  for (let i = 1; nuevos.length < cantidad; i++) {
    const nombre = `Equipo ${i}`;
    if (!usados.has(nombre)) nuevos.push({ evento_id: eventoId, nombre });
  }
  const { error } = await db.from("equipos").insert(nuevos);
  if (error) return { error: "No pudimos crear los equipos." };
  refrescar();
  return { ok: true };
}

export async function renombrarEquipo(equipoId: string, nombre: string): Promise<Resultado> {
  await exigirRol("organizador");
  const limpio = nombre.trim();
  if (limpio.length < 1 || limpio.length > 60) return { error: "El nombre tiene que tener entre 1 y 60 letras." };
  const db = await clienteServidor();
  const { error } = await db.from("equipos").update({ nombre: limpio }).eq("id", equipoId);
  if (error) return { error: error.code === "23505" ? "Ya hay un equipo con ese nombre." : "No pudimos renombrar." };
  refrescar();
  return { ok: true };
}

export async function borrarEquipo(equipoId: string): Promise<Resultado> {
  await exigirRol("organizador");
  const db = await clienteServidor();
  const evals = await db.from("evaluaciones").select("id", { count: "exact", head: true }).eq("equipo_id", equipoId);
  if ((evals.count ?? 0) > 0) return { error: "Ese equipo ya tiene evaluaciones: no se puede borrar." };
  const { error } = await db.from("equipos").delete().eq("id", equipoId);
  if (error) return { error: "No pudimos borrar el equipo." };
  refrescar();
  return { ok: true };
}

export async function moverMiembro(eventoId: string, usuarioId: string, equipoId: string | null): Promise<Resultado> {
  await exigirRol("organizador");
  const db = await clienteServidor();
  const r = equipoId
    ? await db
        .from("miembros_equipo")
        .upsert({ equipo_id: equipoId, evento_id: eventoId, usuario_id: usuarioId }, { onConflict: "evento_id,usuario_id" })
    : await db.from("miembros_equipo").delete().eq("evento_id", eventoId).eq("usuario_id", usuarioId);
  if (r.error) return { error: "No pudimos mover a la persona." };
  refrescar();
  return { ok: true };
}

export async function asignarEvaluador(
  eventoId: string,
  equipoId: string,
  rol: "mentor" | "jurado",
  usuarioId: string,
): Promise<Resultado> {
  await exigirRol("organizador");
  const db = await clienteServidor();
  if (rol === "mentor") {
    // Un mentor por equipo: el nuevo reemplaza al anterior en un solo update (si fallara un
    // borrar-y-crear, el equipo quedaría sin mentor).
    const r = await db.from("asignaciones").update({ evaluador_id: usuarioId }).eq("equipo_id", equipoId).eq("rol", "mentor").select("id");
    if (r.error) return { error: "No pudimos asignar." };
    if ((r.data ?? []).length > 0) {
      refrescar();
      return { ok: true };
    }
  }
  const { error } = await db.from("asignaciones").insert({ evento_id: eventoId, equipo_id: equipoId, rol, evaluador_id: usuarioId });
  if (error && error.code !== "23505") return { error: "No pudimos asignar." };
  refrescar();
  return { ok: true };
}

export async function quitarAsignacion(asignacionId: string): Promise<Resultado> {
  await exigirRol("organizador");
  const db = await clienteServidor();
  const { error } = await db.from("asignaciones").delete().eq("id", asignacionId);
  if (error) return { error: "No pudimos quitar la asignación." };
  refrescar();
  return { ok: true };
}

const invitacion = z.object({
  eventoId: z.uuid().optional(),
  email: z.email("Revisá el mail."),
  nombre: z.string().trim().max(120).optional(),
  rol: z.enum(["mentor", "jurado", "organizador", "estudiante"]),
  equipoId: z.uuid().optional(),
});

export async function invitar(_p: Resultado, form: FormData): Promise<Resultado> {
  const u = await exigirRol("organizador");
  const datos = Object.fromEntries([...form.entries()].filter(([, v]) => v !== ""));
  const v = invitacion.safeParse(datos);
  if (!v.success) return { error: v.error.issues[0]?.message };
  const db = await clienteServidor();
  const { error } = await db.from("invitaciones").insert({
    email: v.data.email.toLowerCase(),
    nombre: v.data.nombre || null,
    rol: v.data.rol,
    evento_id: v.data.rol === "organizador" ? null : (v.data.eventoId ?? null),
    equipo_id: v.data.equipoId ?? null,
    creada_por: u.id,
  });
  if (error) return { error: error.code === "23505" ? "Esa invitación ya existe." : "No pudimos guardar la invitación." };
  refrescar();
  return { ok: true, mensaje: "Listo. Cuando entre con ese mail, ya tiene el rol." };
}

export async function borrarInvitacion(id: string): Promise<Resultado> {
  await exigirRol("organizador");
  const db = await clienteServidor();
  const { error } = await db.from("invitaciones").delete().eq("id", id);
  if (error) return { error: "No pudimos borrar la invitación." };
  refrescar();
  return { ok: true };
}

export async function quitarRol(rolId: string): Promise<Resultado> {
  const u = await exigirRol("organizador");
  const db = await clienteServidor();
  const { data } = await db.from("roles_usuario").select("usuario_id, rol").eq("id", rolId).maybeSingle();
  if (data?.usuario_id === u.id && data.rol === "organizador") return { error: "No te podés sacar tu propio rol de organizador." };
  const { error } = await db.from("roles_usuario").delete().eq("id", rolId);
  if (error) return { error: "No pudimos quitar el rol." };
  refrescar();
  return { ok: true };
}

export async function marcarAsistenciaManual(eventoId: string, usuarioId: string, presente: boolean): Promise<Resultado> {
  await exigirRol("organizador");
  const db = await clienteServidor();
  const r = presente
    ? await db.from("asistencias").upsert({ evento_id: eventoId, usuario_id: usuarioId, metodo: "organizador" }, { onConflict: "evento_id,usuario_id", ignoreDuplicates: true })
    : await db.from("asistencias").delete().eq("evento_id", eventoId).eq("usuario_id", usuarioId);
  if (r.error) return { error: "No pudimos actualizar la asistencia." };
  refrescar();
  return { ok: true };
}

/** Nueva contraseña temporal para quien se la olvidó. No hay mails en esta etapa: se la dicta el organizador. */
export async function restablecerClave(usuarioId: string): Promise<{ clave?: string; error?: string }> {
  await exigirRol("organizador");
  const clave = `tim-${nuevoCodigo(4).toLowerCase()}-${nuevoCodigo(4).toLowerCase()}`;
  const { error } = await clienteServicio().auth.admin.updateUserById(usuarioId, { password: clave });
  if (error) return { error: "No pudimos restablecer la contraseña." };
  return { clave };
}

/** Arma (o rearma) la foto de cada devolución con las evaluaciones enviadas. No publica nada. */
export async function prepararDevoluciones(eventoId: string): Promise<Resultado> {
  await exigirRol("organizador");
  const db = await clienteServidor();
  const { data: ev } = await db.from("eventos").select("rubrica_id, devoluciones_publicadas_en").eq("id", eventoId).single();
  if (!ev) return { error: "No encontramos el evento." };
  if (ev.devoluciones_publicadas_en) return { error: "Las devoluciones ya se publicaron: no se pueden rearmar." };
  const rubrica = await rubricaDelEvento(db, ev.rubrica_id);
  if (!rubrica) return { error: "El evento no tiene rúbrica." };

  const [miembros, evaluaciones] = await Promise.all([
    db.from("miembros_equipo").select("usuario_id, equipo_id, equipos(nombre)").eq("evento_id", eventoId),
    db.from("evaluaciones").select("rol_evaluador, objetivo, estudiante_id, equipo_id, respuestas, comentario").eq("evento_id", eventoId).eq("estado", "enviada"),
  ]);
  const filas = (miembros.data ?? []).map((m) => ({
    evento_id: eventoId,
    estudiante_id: m.usuario_id,
    publicada_en: null,
    preparada_en: new Date().toISOString(),
    contenido: armarDevolucion({
      estudianteId: m.usuario_id,
      equipoId: m.equipo_id,
      equipoNombre: m.equipos?.nombre ?? "",
      dimensiones: rubrica.dimensiones,
      niveles: rubrica.niveles,
      evaluaciones: (evaluaciones.data ?? []) as unknown as EvaluacionEnviada[],
    }),
  }));
  if (filas.length === 0) return { error: "No hay estudiantes en equipos todavía." };
  const { error } = await db.from("devoluciones").upsert(filas, { onConflict: "evento_id,estudiante_id" });
  if (error) return { error: "No pudimos preparar las devoluciones." };
  refrescar();
  return { ok: true, mensaje: `${filas.length} devoluciones preparadas. Revisalas antes de publicar.` };
}

export async function publicarDevoluciones(eventoId: string): Promise<Resultado> {
  await exigirRol("organizador");
  const db = await clienteServidor();
  // Publicar cierra las evaluaciones para siempre. Antes: tiene que haber devoluciones preparadas
  // y ninguna evaluación cambiada después de prepararlas (si no, se publicaría una foto vieja).
  const [prep, ultima] = await Promise.all([
    db.from("devoluciones").select("preparada_en").eq("evento_id", eventoId).order("preparada_en").limit(1).maybeSingle(),
    db.from("evaluaciones").select("actualizado_en").eq("evento_id", eventoId).order("actualizado_en", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!prep.data) return { error: "Primero prepará las devoluciones." };
  if (ultima.data && ultima.data.actualizado_en > prep.data.preparada_en) {
    return { error: "Hay evaluaciones nuevas o corregidas desde que preparaste. Volvé a preparar y revisá antes de publicar." };
  }
  const ahora = new Date().toISOString();
  const pub = await db.from("devoluciones").update({ publicada_en: ahora }).eq("evento_id", eventoId).is("publicada_en", null).select("id");
  if (pub.error) return { error: "No pudimos publicar." };
  const ev = await db.from("eventos").update({ devoluciones_publicadas_en: ahora }).eq("id", eventoId);
  if (ev.error) return { error: "Se publicaron, pero no pudimos cerrar las evaluaciones del evento. Probá de nuevo." };
  refrescar();
  return { ok: true, mensaje: `Publicadas: ${pub.data?.length ?? 0}. Ya las ven los estudiantes.` };
}

export async function urlCv(usuarioId: string): Promise<{ url?: string; error?: string }> {
  await exigirRol("organizador");
  const db = await clienteServidor();
  const { data, error } = await db.storage.from("cvs").createSignedUrl(`${usuarioId}/cv.pdf`, 120);
  if (error || !data) return { error: "No encontramos el CV." };
  return { url: data.signedUrl };
}
