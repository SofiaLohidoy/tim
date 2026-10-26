"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { clienteServidor } from "@/lib/supabase/servidor";
import { cargarUsuario, destinoSeguro, destinoTrasIngreso } from "@/lib/sesion";
import { resolverDestino } from "@/lib/destino";

export type EstadoIngreso = { error?: string; email?: string };

const credenciales = z.object({
  email: z.email("Revisá el mail: parece incompleto."),
  password: z.string().min(8, "La contraseña tiene que tener al menos 8 caracteres."),
});

// Se resuelve acá y no redirigiendo a /continuar: un redirect de Server Action a un route handler
// que vuelve a redirigir deja la URL vieja en la barra.
async function destino(db: Awaited<ReturnType<typeof clienteServidor>>, id: string, email: string, form: FormData) {
  const u = await cargarUsuario(db, id, email);
  return resolverDestino(db, u, destinoTrasIngreso(u, destinoSeguro(String(form.get("siguiente") ?? ""))));
}

export async function crearCuenta(_p: EstadoIngreso, form: FormData): Promise<EstadoIngreso> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const datos = credenciales.safeParse({ email, password: form.get("password") });
  if (!datos.success) return { error: datos.error.issues[0]?.message, email };

  const db = await clienteServidor();
  const { data, error } = await db.auth.signUp(datos.data);
  if (error) {
    if (error.code === "user_already_exists") {
      return { error: "Ya hay una cuenta con ese mail. Entrá con tu contraseña.", email };
    }
    if (error.code === "weak_password") return { error: "Elegí una contraseña más difícil de adivinar.", email };
    console.error("[auth] signUp", error.code, error.message);
    return { error: "No pudimos crear la cuenta. Probá de nuevo en un momento.", email };
  }
  // Con la confirmación por mail apagada, signUp ya deja la sesión abierta. Si no vino sesión,
  // el proyecto de Supabase tiene la confirmación prendida: ver docs/puesta-en-marcha.md.
  if (!data.session || !data.user) return { error: "La cuenta se creó, pero falta confirmar el mail. Avisale al equipo TIM.", email };
  if (form.get("siguiente") === "/empresa") {
    const { error: errorEmpresa } = await db.rpc("iniciar_registro_empresa");
    if (errorEmpresa) return { error: "Tu cuenta se creó. Entrá de nuevo desde el registro de empresas para continuar.", email };
  }
  redirect(await destino(db, data.user.id, email, form));
}

export async function ingresar(_p: EstadoIngreso, form: FormData): Promise<EstadoIngreso> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Completá tu mail y tu contraseña.", email };

  const db = await clienteServidor();
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    if (error?.code === "invalid_credentials") return { error: "El mail o la contraseña no coinciden.", email };
    console.error("[auth] signIn", error?.code, error?.message);
    return { error: "No pudimos hacerte entrar. Probá de nuevo en un momento.", email };
  }
  redirect(await destino(db, data.user.id, email, form));
}

export async function ingresarConGoogle(form: FormData) {
  const sitio = process.env.NEXT_PUBLIC_SITIO_URL ?? "http://localhost:3001";
  const s = destinoSeguro(String(form.get("siguiente") ?? ""));
  const db = await clienteServidor();
  const { data, error } = await db.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${sitio}/auth/callback${s ? `?siguiente=${encodeURIComponent(s)}` : ""}` },
  });
  if (error || !data.url) redirect("/ingresar?error=google");
  redirect(data.url);
}

export async function salir() {
  const db = await clienteServidor();
  await db.auth.signOut();
  redirect("/ingresar");
}
