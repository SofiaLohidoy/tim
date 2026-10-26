/** Lee una variable de entorno obligatoria. El error dice qué falta y dónde se configura. */
export function env(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(
      `Falta la variable de entorno ${nombre}. En local va en .env.local (ver docs/trabajar-en-local.md); en Vercel, en Settings > Environment Variables.`,
    );
  }
  return valor;
}

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLICA = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const GOOGLE_HABILITADO = process.env.NEXT_PUBLIC_GOOGLE_HABILITADO === "1";
