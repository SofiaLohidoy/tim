import {NextResponse} from "next/server";
import {z} from "zod";
import {usuarioActual} from "@/lib/sesion";
import {clienteServidor} from "@/lib/supabase/servidor";
// Descarga con la sesión (SELECT + RLS), sin URL pública ni firmada compartible.
// Fuente: https://supabase.com/docs/reference/javascript/storage-from-download (03/11/2026).
export async function GET(req:Request,{params}:RouteContext<"/desafios/archivos/[id]">){
 const p=await params;if(!z.uuid().safeParse(p.id).success)return new Response("No encontramos el archivo.",{status:404});
 const u=await usuarioActual();if(!u)return NextResponse.redirect(new URL(`/ingresar?siguiente=${encodeURIComponent(new URL(req.url).pathname)}`,req.url));
 const db=await clienteServidor();const a=await db.from("archivos_desafios_virtuales").select("ruta,nombre,mime").eq("id",p.id).maybeSingle();
 if(a.error)return new Response("No pudimos consultar el archivo.",{status:503});if(!a.data)return new Response("No encontramos el archivo o no tenés acceso.",{status:404});
 const r=await db.storage.from("desafios-virtuales").download(a.data.ruta,{cacheNonce:crypto.randomUUID()},{cache:"no-store"});if(r.error||!r.data)return new Response("No pudimos abrir el archivo. Probá de nuevo.",{status:503});
 return new Response(new Uint8Array(await r.data.arrayBuffer()),{headers:{"Content-Type":a.data.mime,"Content-Disposition":`attachment; filename*=UTF-8''${encodeURIComponent(a.data.nombre)}`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
