"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirUsuario, destinoSeguro } from "@/lib/sesion";
import { avanzar, respuestasDelCamino } from "@/lib/arquetipo";
import { ANIOS_CARRERA, AREAS, MOTIVOS } from "@/lib/estudiante/opciones";

const esquema = z.object({
  nombre: z.string().trim().min(1, "Falta tu nombre.").max(60),
  apellido: z.string().trim().min(1, "Falta tu apellido.").max(60),
  universidad: z.string().trim().min(2, "Falta tu universidad.").max(120),
  carrera: z.string().trim().min(2, "Falta tu carrera.").max(120),
  anio: z.enum(ANIOS_CARRERA, { error: "Elegí en qué año estás." }),
  consentimiento: z.literal(true, { error: "Necesitamos tu consentimiento para seguir." }),
  intereses: z.array(z.enum(AREAS)).min(1, "Elegí al menos un área.").max(3, "Elegí hasta tres áreas."),
  motivos: z.array(z.enum(MOTIVOS)).max(MOTIVOS.length),
  porQue: z.string().trim().max(300),
  respuestas: z.record(z.string(), z.boolean()),
  siguiente: z.string().optional(),
});

export type DatosOnboarding = z.input<typeof esquema>;

export async function guardarOnboarding(datos: DatosOnboarding): Promise<{ error?: string }> {
  const u = await exigirUsuario();
  const v = esquema.safeParse(datos);
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Revisá los datos." };

  const respuestas = respuestasDelCamino(v.data.respuestas);
  const paso = avanzar(respuestas);
  if (!("arquetipo" in paso)) return { error: "Falta responder las preguntas del paso 3." };

  const db = await clienteServidor();
  const perfil = await db.from("perfiles").update({ nombre: v.data.nombre, apellido: v.data.apellido }).eq("id", u.id);
  if (perfil.error) {
    console.error("[onboarding] perfil", perfil.error);
    return { error: "No pudimos guardar tu nombre. Probá de nuevo." };
  }

  const porQue = [...v.data.motivos, v.data.porQue].filter(Boolean).join(" · ");
  const ahora = new Date().toISOString();
  const { error } = await db.from("estudiantes").upsert(
    {
      usuario_id: u.id,
      universidad: v.data.universidad,
      carrera: v.data.carrera,
      anio_carrera: v.data.anio,
      area_buscada: v.data.intereses[0],
      intereses: v.data.intereses,
      por_que: porQue || null,
      arquetipo: paso.arquetipo,
      arquetipo_respuestas: respuestas,
      consentimiento_en: ahora,
      onboarding_completo_en: ahora,
    },
    { onConflict: "usuario_id" },
  );
  if (error) {
    console.error("[onboarding] estudiante", error);
    return { error: "No pudimos guardar tus datos. Probá de nuevo." };
  }
  redirect(`/hackaton/bienvenida?siguiente=${encodeURIComponent(destinoSeguro(v.data.siguiente) ?? "/inicio")}`);
}
