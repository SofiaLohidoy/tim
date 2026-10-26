"use server";

export type EstadoSimple = { error?: string; ok?: boolean };

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirUsuario } from "@/lib/sesion";

export async function marcarConCodigo(_p: EstadoSimple, form: FormData): Promise<EstadoSimple> {
  await exigirUsuario();
  const codigo = String(form.get("codigo") ?? "").trim();
  if (codigo.length < 4) return { error: "El código tiene 6 letras. Está en la pantalla de la entrada." };
  const db = await clienteServidor();
  const { error } = await db.rpc("marcar_asistencia", { p_codigo: codigo });
  if (error) {
    return {
      error: error.message.includes("codigo_invalido")
        ? "Ese código no es el de ahora. Mirá la pantalla de nuevo: cambia cada minuto."
        : "No pudimos marcar tu asistencia. Probá de nuevo o avisale a alguien del equipo TIM.",
    };
  }
  revalidatePath("/inicio");
  return { ok: true };
}

const url = z.url({ protocol: /^https?$/, error: "Pegá un link que empiece con https://" }).max(500);

export async function registrarEntrega(_p: EstadoSimple, form: FormData): Promise<EstadoSimple> {
  await exigirUsuario();
  const equipo = String(form.get("equipo") ?? "");
  const v = url.safeParse(String(form.get("url") ?? "").trim());
  if (!v.success) return { error: v.error.issues[0]?.message };
  const db = await clienteServidor();
  const { error } = await db.rpc("registrar_entrega", { p_equipo: equipo, p_url: v.data });
  if (error) return { error: "No pudimos guardar el link. Probá de nuevo." };
  revalidatePath("/inicio");
  return { ok: true };
}

export async function guardarCv(ruta: string | null) {
  const u = await exigirUsuario();
  if (ruta !== null && ruta !== `${u.id}/cv.pdf`) return { error: "Ruta de CV inválida." };
  const db = await clienteServidor();
  if (ruta === null) await db.storage.from("cvs").remove([`${u.id}/cv.pdf`]);
  const { error } = await db.from("estudiantes").update({ cv_path: ruta }).eq("usuario_id", u.id);
  if (error) return { error: "No pudimos guardar tu CV. Probá de nuevo." };
  revalidatePath("/inicio");
  revalidatePath("/perfil");
  return {};
}

export async function responderEncuesta(eventoId: string, respuestas: Record<string, string>) {
  const u = await exigirUsuario();
  if (!z.uuid().safeParse(eventoId).success) return { error: "Evento inválido." };
  const v = z
    .object({
      sirvio: z.enum(["si", "mas_o_menos", "no"]),
      seguir: z.enum(["si", "tal_vez", "no"]),
      compartir: z.enum(["si", "tal_vez", "no"]),
    })
    .safeParse(respuestas);
  if (!v.success) return { error: "Respondé las tres preguntas." };
  const db = await clienteServidor();
  // Solo responde quien ya ve su devolución publicada de ese evento (la RLS la oculta si no).
  const dev = await db.from("devoluciones").select("id").eq("evento_id", eventoId).eq("estudiante_id", u.id).maybeSingle();
  if (!dev.data) return { error: "Tu devolución todavía no está publicada." };
  const { error } = await db
    .from("respuestas_encuesta")
    .insert({ usuario_id: u.id, encuesta: "post_devolucion", evento_id: eventoId, respuestas: v.data });
  if (error && error.code !== "23505") return { error: "No pudimos guardar tus respuestas. Probá de nuevo." };
  revalidatePath("/devolucion");
  return {};
}

export async function marcarAbierta(devolucionId: string) {
  await exigirUsuario();
  const db = await clienteServidor();
  await db.rpc("marcar_devolucion_abierta", { p_devolucion: devolucionId });
}
