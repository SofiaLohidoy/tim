"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirUsuario } from "@/lib/sesion";

const esquema = z.object({
  nombre: z.string().trim().min(2).max(120),
  rubro: z.string().trim().min(2).max(120),
  tamano: z.enum(["1-9", "10-49", "50+"]),
});

export async function guardarEmpresa(_previo: { error?: string }, form: FormData): Promise<{ error?: string }> {
  await exigirUsuario("/empresa");
  const datos = esquema.safeParse(Object.fromEntries(form));
  if (!datos.success) return { error: "Completá nombre, rubro y tamaño. Usá entre 2 y 120 caracteres en los textos." };
  const db = await clienteServidor();
  const { error } = await db.rpc("guardar_empresa", { p_nombre: datos.data.nombre, p_rubro: datos.data.rubro, p_tamano: datos.data.tamano });
  if (error) return { error: "No pudimos guardar tu empresa. Probá de nuevo." };
  redirect(`/empresa?guardado=${crypto.randomUUID()}`);
}
