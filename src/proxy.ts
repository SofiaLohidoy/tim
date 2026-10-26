import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Dos trabajos, nada más (el proxy no es lugar para lógica lenta):
// 1. Landing (`/`): reparte la variante del título con cookie fija por visitante y reescribe a
//    la versión estática `/l/a` o `/l/b`. Así la landing sigue saliendo del CDN.
// 2. Resto de la app: refresca la sesión de Supabase. Tiene que estar acá porque durante el
//    render de un Server Component no se pueden escribir cookies; sin esto la sesión se vence
//    sola y la persona vuelve al login sin motivo.

const UN_ANIO = 60 * 60 * 24 * 365;

function landing(req: NextRequest) {
  const vid = req.cookies.get("tim_vid")?.value ?? crypto.randomUUID();
  const actual = req.cookies.get("tim_var")?.value;
  const variante = actual === "a" || actual === "b" ? actual : Math.random() < 0.5 ? "a" : "b";
  const url = req.nextUrl.clone();
  url.pathname = `/l/${variante}`;
  const res = NextResponse.rewrite(url);
  const opciones = { maxAge: UN_ANIO, sameSite: "lax" as const, path: "/" };
  res.cookies.set("tim_vid", vid, opciones);
  res.cookies.set("tim_var", variante, opciones);
  return res;
}

export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === "/") return landing(req);
  // Sin Supabase configurado (deploy de la landing antes de tener la base) no hay sesión que refrescar.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.next();

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (aEscribir) => {
          aEscribir.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          aEscribir.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    },
  );
  await supabase.auth.getClaims();
  return res;
}

export const config = {
  matcher: [
    // Todo menos assets, la API de la landing (beacons anónimos), el cron y las páginas
    // estáticas de la landing ya reescritas.
    "/((?!_next/static|_next/image|api/landing|api/cron|l/|icon|apple-icon|opengraph-image|favicon|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
