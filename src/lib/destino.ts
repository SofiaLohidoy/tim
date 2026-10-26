import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipos";
import type { Usuario } from "@/lib/sesion";

/**
 * Resuelve los destinos con efecto (/a/<codigo> marca asistencia, /invitacion/<token> aplica el
 * rol) y devuelve la pantalla final. Lo usan los route handlers y las Server Actions de ingreso:
 * un redirect de Server Action a un route handler que vuelve a redirigir deja la URL vieja en la
 * barra (y la pantalla equivocada para la navegación de abajo).
 */
export async function resolverDestino(
  db: SupabaseClient<Database>,
  u: Usuario,
  destino: string,
): Promise<string> {
  const asistencia = destino.match(/^\/a\/([A-Za-z0-9]+)$/);
  if (asistencia) {
    const { error } = await db.rpc("marcar_asistencia", { p_codigo: asistencia[1] });
    const resultado = error ? (error.message.includes("codigo_invalido") ? "vencido" : "error") : "ok";
    if (error && resultado === "error") console.error("[asistencia]", error.message);
    const inicio = `/inicio?asistencia=${resultado}`;
    const esStaff = u.roles.some((r) => r !== "estudiante");
    return u.onboardingCompleto || esStaff ? inicio : `/bienvenida?siguiente=${encodeURIComponent(inicio)}`;
  }
  const invitacion = destino.match(/^\/invitacion\/([0-9a-f-]{36})$/);
  if (invitacion) {
    const { error } = await db.rpc("reclamar_invitacion", { p_token: invitacion[1] });
    if (error) return `/ingresar?aviso=${error.message.includes("otro_mail") ? "otro_mail" : "inexistente"}`;
    if (u.roles.includes("organizador")) return "/organizador";
    const { data } = await db.from("roles_usuario").select("rol").eq("usuario_id", u.id);
    const roles = (data ?? []).map((r) => r.rol);
    return roles.includes("organizador") ? "/organizador" : roles.includes("mentor") ? "/mentor" : roles.includes("jurado") ? "/jurado" : "/continuar";
  }
  return destino;
}
