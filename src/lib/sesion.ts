import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/servidor";

export type Rol = "estudiante" | "mentor" | "jurado" | "organizador" | "empresa";

export type Usuario = {
  id: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
  roles: Rol[];
  onboardingCompleto: boolean;
};

/**
 * La persona logueada, o null. Una sola lectura por pedido (cache de React).
 * Verifica el JWT con getClaims; nunca confía en la sesión de la cookie sin verificar.
 */
export const usuarioActual = cache(async (): Promise<Usuario | null> => {
  const db = await clienteServidor();
  const { data } = await db.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;
  return cargarUsuario(db, id, String(data.claims.email ?? ""));
});

/** Roles y estado de onboarding de una persona, con el cliente que ya tiene su sesión. */
export async function cargarUsuario(db: Awaited<ReturnType<typeof clienteServidor>>, id: string, emailClaims = ""): Promise<Usuario> {
  const [perfil, roles, estudiante] = await Promise.all([
    db.from("perfiles").select("email, nombre, apellido").eq("id", id).maybeSingle(),
    db.from("roles_usuario").select("rol").eq("usuario_id", id),
    db.from("estudiantes").select("onboarding_completo_en").eq("usuario_id", id).maybeSingle(),
  ]);

  return {
    id,
    email: perfil.data?.email ?? emailClaims,
    nombre: perfil.data?.nombre ?? null,
    apellido: perfil.data?.apellido ?? null,
    roles: [...new Set((roles.data ?? []).map((r) => r.rol as Rol))],
    onboardingCompleto: Boolean(estudiante.data?.onboarding_completo_en),
  };
}

/** Exige sesión. Sin sesión, al login y de vuelta a donde estaba. */
export async function exigirUsuario(volverA?: string): Promise<Usuario> {
  const u = await usuarioActual();
  if (!u) redirect(volverA ? `/ingresar?siguiente=${encodeURIComponent(volverA)}` : "/ingresar");
  return u;
}

/** Exige un rol. La RLS lo hace cumplir igual en la base: esto es para no mostrar pantallas vacías. */
export async function exigirRol(rol: Rol, volverA?: string): Promise<Usuario> {
  const u = await exigirUsuario(volverA);
  if (!u.roles.includes(rol)) redirect("/continuar");
  return u;
}

/** A dónde va cada persona al entrar. Staff primero: un mentor no tiene que pasar por el onboarding. */
export function destinoPara(u: Usuario): string {
  if (u.roles.includes("organizador")) return "/organizador";
  if (u.roles.includes("mentor")) return "/mentor";
  if (u.roles.includes("jurado")) return "/jurado";
  if (u.roles.includes("empresa")) return "/empresa";
  if (!u.onboardingCompleto) return "/bienvenida";
  return "/inicio";
}

export function nombreVisible(u: { nombre: string | null; apellido: string | null; email: string }) {
  const n = [u.nombre, u.apellido].filter(Boolean).join(" ").trim();
  return n || u.email.split("@")[0];
}

/** A dónde ir después de entrar: a donde venía (si corresponde) o a la pantalla de su rol. */
export function destinoTrasIngreso(u: Usuario, siguiente: string | null): string {
  const s = destinoSeguro(siguiente);
  const esStaff = u.roles.some((r) => r === "organizador" || r === "mentor" || r === "jurado");
  if (s === "/empresa") return "/empresa";
  if (s && (esStaff || u.onboardingCompleto || s.startsWith("/a/") || s.startsWith("/invitacion/"))) return s;
  return destinoPara(u);
}

/** Solo acepta rutas internas como destino (evita open redirect por ?siguiente=). */
export function destinoSeguro(siguiente: string | null | undefined): string | null {
  if (!siguiente || !siguiente.startsWith("/")) return null;
  // `/\otro.com` o `/\t/otro.com` pasan un chequeo de "empieza con /" y el navegador los resuelve
  // como otro dominio. Se rechaza todo lo que, resuelto, no quede en el mismo origen.
  if (/[\\\u0000-\u001f]/.test(siguiente)) return null;
  try {
    const url = new URL(siguiente, "http://tim.local");
    if (url.origin !== "http://tim.local") return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}
