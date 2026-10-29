import "server-only";
import type { Usuario } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";
import { eventoActual } from "@/lib/eventos";

/** El alta en TIM no inscribe al evento: lo confirma el QR/código (asistencias).
 * El staff conserva acceso para acompañar y evaluar la hackatón.
 * La consulta usa la sesión de la persona y la RLS, nunca la clave de servicio.
 */
export async function puedeVerEmpresas(u: Usuario): Promise<boolean> {
  if (u.roles.some(r => ["organizador", "mentor", "jurado"].includes(r))) return true;
  if (!u.onboardingCompleto) return false;
  const db = await clienteServidor();
  const evento = await eventoActual(db);
  if (!evento) return false;
  const { data, error } = await db.from("asistencias").select("usuario_id")
    .eq("evento_id", evento.id).eq("usuario_id", u.id).maybeSingle();
  return !error && Boolean(data);
}
