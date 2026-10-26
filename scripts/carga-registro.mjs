// Simula a N personas registrándose y entrando a la vez, como lo hace el servidor (todas desde
// la misma IP). Sirve para comprobar los límites de tasa de Supabase Auth antes del evento.
//   node scripts/carga-registro.mjs 45 [ms entre llegadas, por defecto 700]
// Supabase deja un pico fijo de 30 pedidos juntos por IP: 45 en el mismo segundo se traban,
// pero en la puerta nadie llega en el mismo segundo. 700 ms = 45 personas en ~30 s.
// Crea cuentas prueba-carga-N; borralas con `pnpm datos:limpiar`.
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: process.env.ENV_ARCHIVO ?? ".env.local", quiet: true });
const n = Number(process.argv[2] ?? 45);
const ritmo = Number(process.argv[3] ?? 700);
const clave = process.env.PRUEBA_CLAVE ?? "prueba-tim-2026";
const nuevo = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });

const marca = Date.now();
const resultados = await Promise.all(
  Array.from({ length: n }, async (_, i) => {
    await new Promise((r) => setTimeout(r, i * ritmo));
    const email = `prueba-carga-${marca}-${i}@tim.test`;
    const alta = await nuevo().auth.signUp({ email, password: clave });
    if (alta.error) return `alta:${alta.error.status ?? alta.error.code}`;
    const ingreso = await nuevo().auth.signInWithPassword({ email, password: clave });
    return ingreso.error ? `ingreso:${ingreso.error.status ?? ingreso.error.code}` : "ok";
  }),
);
const cuenta = resultados.reduce((m, r) => ((m[r] = (m[r] ?? 0) + 1), m), {});
console.log(`${n} personas →`, cuenta);
process.exit(cuenta.ok === n ? 0 : 1);
