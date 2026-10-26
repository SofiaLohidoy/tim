"use server";

import { revalidatePath } from "next/cache";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirUsuario } from "@/lib/sesion";

export async function crearCredencial(): Promise<{ error?: string }> {
  const u = await exigirUsuario();
  const db = await clienteServidor();
  const { error } = await db.from("credenciales").insert({ usuario_id: u.id });
  if (error) return { error: "No pudimos crear tu credencial. Probá de nuevo." };
  revalidatePath("/perfil");
  return {};
}

/** Revoca el link actual: quien lo tenga deja de ver tu evidencia. Se puede crear uno nuevo. */
export async function revocarCredencial(token: string): Promise<{ error?: string }> {
  const u = await exigirUsuario();
  const db = await clienteServidor();
  const { error } = await db.from("credenciales").update({ revocada_en: new Date().toISOString() }).eq("token", token).eq("usuario_id", u.id);
  if (error) return { error: "No pudimos revocar el link." };
  revalidatePath("/perfil");
  return {};
}
