"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clienteServidor } from "@/lib/supabase/servidor";
import { clienteServicio } from "@/lib/supabase/servicio";
import { exigirRol } from "@/lib/sesion";
import { nuevoCodigo } from "@/lib/codigo";
import { rubricaDelEvento } from "@/lib/rubrica";
import type { Json } from "@/lib/supabase/tipos";
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

/** Auth Admin y Storage exigen secreto; la sesión y la RPC autorizan y respaldan primero.
 * Fuente: https://supabase.com/docs/guides/auth/managing-user-data (26/10/2026).
 * Storage se borra por API antes de Auth; si falla Auth, se restaura el CV desde memoria.
 */
export async function eliminarEstudiante(usuarioId: string, email: string): Promise<Resultado> {
  const u = await exigirRol("organizador");
  const v = z.object({ id: z.uuid(), email: z.email().max(254) }).safeParse({ id: usuarioId, email: email.trim() });
  if (!v.success) return { error: "Escribí el mail completo de la persona para confirmar." };
  if (usuarioId === u.id) return { error: "No podés eliminar tu propia cuenta." };
  const db = await clienteServidor();
  const { data: persona, error: consulta } = await db.from("perfiles").select("email, estudiantes(cv_path), roles_usuario(rol)").eq("id", usuarioId).maybeSingle();
  if (consulta || !persona) return { error: "No encontramos a esa persona. Recargá la lista." };
  if (persona.email.toLowerCase() !== v.data.email.toLowerCase()) return { error: "El mail no coincide con la persona elegida." };
  if (!persona.estudiantes || persona.roles_usuario.some((r) => r.rol !== "estudiante")) return { error: "Esta cuenta tiene otro rol y no se puede eliminar desde Estudiantes." };
  const servicio = clienteServicio();
  const ruta = `${usuarioId}/cv.pdf`;
  // También se comprueba un CV huérfano cuyo upload terminó antes de guardar cv_path.
  const archivos = await servicio.storage.from("cvs").list(usuarioId, { search: "cv.pdf" });
  if (archivos.error) return { error: "No pudimos comprobar el CV. No se eliminó la cuenta." };
  const hayCv = archivos.data.some((a) => a.name === "cv.pdf");
  let cv: Blob | null = null;
  if (hayCv) {
    const descarga = await servicio.storage.from("cvs").download(ruta);
    if (descarga.error) return { error: "No pudimos respaldar el CV. No se eliminó la cuenta." };
    cv = descarga.data;
  }
  const { error: respaldo } = await db.rpc("respaldar_estudiante", {
    p_usuario: usuarioId, p_email: v.data.email,
    p_cv_base64: cv ? Buffer.from(await cv.arrayBuffer()).toString("base64") : undefined,
  });
  if (respaldo) {
    if (respaldo.message.includes("cuenta_protegida")) return { error: "Esta cuenta tiene otro rol y no se puede eliminar desde Estudiantes." };
    return { error: "No pudimos guardar el respaldo. No se eliminó la cuenta." };
  }
  if (cv) {
    const quitar = await servicio.storage.from("cvs").remove([ruta]);
    if (quitar.error) return { error: "No pudimos quitar el CV. No se eliminó la cuenta." };
  }
  const borrado = await servicio.auth.admin.deleteUser(usuarioId);
  if (borrado.error) {
    if (cv) {
      const restaurar = await servicio.storage.from("cvs").upload(ruta, cv, { contentType: "application/pdf", upsert: true });
      if (restaurar.error) return { error: "La cuenta sigue activa. El CV quedó respaldado y requiere recuperación por el equipo TIM." };
    }
    return { error: "No pudimos eliminar la cuenta. Sus datos siguen guardados." };
  }
  const invitaciones = await servicio.from("invitaciones").delete().eq("email", persona.email).eq("rol", "estudiante");
  refrescar();
  if (invitaciones.error) return { ok: true, mensaje: "Cuenta eliminada. Quedó una invitación pendiente para revisar en Personas." };
  return { ok: true, mensaje: "Cuenta y datos eliminados. Se guardó un respaldo privado." };
}

/** Arma (o rearma) la foto de cada devolución con las evaluaciones enviadas. No publica nada. */
export async function prepararDevoluciones(eventoId: string): Promise<Resultado> {
  await exigirRol("organizador");
  const db = await clienteServidor();
  if (!z.uuid().safeParse(eventoId).success) return {error:"El evento no es válido."};
  const { data: ev } = await db.from("eventos").select("rubrica_id, revision_evaluaciones").eq("id", eventoId).single();
  if (!ev) return { error: "No encontramos el evento." };
  const rubrica = await rubricaDelEvento(db, ev.rubrica_id);
  if (!rubrica) return { error: "El evento no tiene rúbrica." };

  const [miembros, evaluaciones] = await Promise.all([
    db.from("miembros_equipo").select("usuario_id, equipo_id, equipos(nombre)").eq("evento_id", eventoId),
    db.from("evaluaciones").select("rol_evaluador, objetivo, estudiante_id, equipo_id, respuestas, comentario").eq("evento_id", eventoId).eq("estado", "enviada"),
  ]);
  if (miembros.error || evaluaciones.error) return {error:"No pudimos leer todas las evaluaciones. Probá de nuevo."};
  const filas = (miembros.data ?? []).map((m) => ({
    estudiante_id: m.usuario_id,
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
  const { error } = await db.rpc("guardar_preparacion_devoluciones", {p_evento:eventoId,p_revision:ev.revision_evaluaciones,p_filas:filas as unknown as Json});
  if (error) return {error:error.message.includes("evaluaciones_cambiadas")?"Llegaron evaluaciones mientras preparabas. Volvé a preparar.":"No pudimos preparar las devoluciones."};
  refrescar();
  return { ok: true, mensaje: `${filas.length} devoluciones preparadas. Revisalas antes de publicar.` };
}

export async function publicarDevoluciones(eventoId: string): Promise<Resultado> {
  await exigirRol("organizador");
  const db = await clienteServidor();
  if (!z.uuid().safeParse(eventoId).success) return {error:"El evento no es válido."};
  const {data,error}=await db.rpc("publicar_preparacion_devoluciones",{p_evento:eventoId});
  if(error)return {error:error.message.includes("sin_preparacion")?"Primero prepará las devoluciones.":error.message.includes("evaluaciones_cambiadas")?"Hay evaluaciones nuevas o corregidas. Volvé a preparar y revisá antes de publicar.":"No pudimos publicar. Las devoluciones anteriores siguen visibles."};
  refrescar();
  revalidatePath("/devolucion");revalidatePath("/perfil");
  revalidatePath("/mentor","layout");revalidatePath("/jurado","layout");
  return {ok:true,mensaje:`Publicadas: ${data}. Ya las ven los estudiantes.`};
}

export async function urlCv(usuarioId: string): Promise<{ url?: string; error?: string }> {
  await exigirRol("organizador");
  const db = await clienteServidor();
  const { data, error } = await db.storage.from("cvs").createSignedUrl(`${usuarioId}/cv.pdf`, 120);
  if (error || !data) return { error: "No encontramos el CV." };
  return { url: data.signedUrl };
}
