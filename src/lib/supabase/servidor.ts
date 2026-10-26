import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_PUBLICA, SUPABASE_URL } from "@/lib/env";
import type { Database } from "./tipos";

/**
 * Cliente para Server Components, Server Actions y route handlers. Respeta RLS: ve lo que ve el
 * usuario logueado.
 *
 * Durante el render de un Server Component no se pueden escribir cookies, por eso `setAll` se
 * traga el error: el refresh de sesión lo hace src/proxy.ts, que sí puede escribirlas.
 */
export async function clienteServidor() {
  // Con cacheComponents, supabase-js lee Date.now() al cargar la sesión y Next lo marca como
  // valor inestable durante el prerender. connection() deja explícito que esto es del pedido.
  await connection();
  const store = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLICA, {
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
