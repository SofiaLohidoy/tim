import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_PUBLICA, SUPABASE_URL } from "@/lib/env";

/**
 * Cliente para Server Components, Server Actions y route handlers. Respeta RLS: ve lo que ve el
 * usuario logueado.
 *
 * Durante el render de un Server Component no se pueden escribir cookies, por eso `setAll` se
 * traga el error: el refresh de sesión lo hace src/proxy.ts, que sí puede escribirlas.
 */
export async function clienteServidor() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLICA, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (aEscribir) => {
        try {
          aEscribir.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Render de Server Component: lo resuelve el proxy.
        }
      },
    },
  });
}
