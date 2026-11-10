import { z } from "zod";
import { usuarioActual } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";

export async function GET(_req: Request, ctx: RouteContext<"/empresa/informes/[id]">) {
  const { id } = await ctx.params;
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (!z.uuid().safeParse(id).success) return new Response("El informe no está disponible.", { status: 404, headers });
  if (!await usuarioActual()) return new Response("Entrá con tu cuenta de empresa para consultar la devolución.", { status: 401, headers });
  const db = await clienteServidor();
  const { data: informe, error } = await db.from("informes_empresa").select("archivo_ruta").eq("id", id).maybeSingle();
  if (error) return new Response("No pudimos abrir el informe. Probá de nuevo.", { status: 503, headers });
  if (!informe) return new Response("El informe no está disponible para tu empresa.", { status: 404, headers });
  const archivo = await db.storage.from("informes-empresa").download(informe.archivo_ruta, { cacheNonce: crypto.randomUUID() }, { cache: "no-store" });
  if (archivo.error || !archivo.data) return new Response("No pudimos abrir el informe. Probá de nuevo en un momento.", { status: 503, headers });
  // El HTML vive aislado: sin cookies, acceso a TIM ni conexiones externas.
  // CSP sandbox: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/sandbox (10/11/2026).
  return new Response(new Uint8Array(await archivo.data.arrayBuffer()), { headers: {
    ...headers,
    "Content-Type": "text/html; charset=utf-8",
    "Content-Encoding": "gzip",
    "Content-Disposition": 'inline; filename="TIM-Lisa-Informe.html"',
    "Content-Security-Policy": "sandbox allow-scripts allow-modals allow-downloads; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
    "Referrer-Policy": "no-referrer",
  } });
}
