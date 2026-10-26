import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env, SUPABASE_URL } from "@/lib/env";

/**
 * Cliente con la clave secreta: SALTEA la RLS.
 *
 * Solo para lo que no tiene dueño logueado: los registros de la landing (interesados y
 * eventos_landing no tienen policy de INSERT a propósito) y el cron de salud. Nunca desde un
 * componente de cliente: el `server-only` de arriba rompe el build si alguien lo importa mal.
 */
export function clienteServicio() {
  return createClient(SUPABASE_URL, env("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
