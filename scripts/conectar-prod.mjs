// Conecta un proyecto de Supabase en la nube (tim-prod o tim-dev) con la app en Vercel, de punta a
// punta. Lo corre Claude cuando Sofía crea su cuenta e invita a Programon. Ver docs/puesta-en-marcha.md.
//
//   SUPABASE_ACCESS_TOKEN=sbp_... SUPABASE_DB_PASSWORD=... \
//   node scripts/conectar-prod.mjs <project-ref> [--sitio https://tim-alpha-eight.vercel.app] \
//        [--organizadores mail1,mail2] [--vercel-env production] [--sin-vercel]
//
// Qué hace, en orden (cada paso se puede volver a correr sin romper nada):
//  1. `supabase link` + `supabase db push` (todas las migraciones).
//  2. Configura Auth por la Management API (spec verificada el 26/10/2026 en
//     https://api.supabase.com/api/v1-json, PATCH /v1/projects/{ref}/config/auth):
//     confirmación de mail apagada, URLs del sitio, contraseña ≥ 8, y límites de tasa altos. El
//     registro corre en el servidor (todas las personas comparten la IP de Vercel) y la hackatón
//     sale con una sola IP: con los 30 por 5 minutos de fábrica se traban 40 personas en la puerta.
//  3. Trae las claves (GET /v1/projects/{ref}/api-keys?reveal=true) y las carga en Vercel.
//  4. Crea las invitaciones de organizador e imprime sus links.
//  5. Redeploya producción y espera a que quede READY.
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const ref = args[0];
const opcion = (n, def) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : def);
const sitio = opcion("sitio", "https://tim-alpha-eight.vercel.app");
const organizadores = (opcion("organizadores", "") || "").split(",").filter(Boolean);
const vercelEnv = opcion("vercel-env", "production");
const SCOPE = "programoninnovation-2426s-projects";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ref || !/^[a-z]{20}$/.test(ref)) throw new Error("Pasá el project ref (20 letras) como primer argumento.");
if (!TOKEN?.startsWith("sbp_")) throw new Error("Falta SUPABASE_ACCESS_TOKEN (sbp_...): sale de `supabase login` o del dashboard → Account → Access Tokens.");
if (!process.env.SUPABASE_DB_PASSWORD) throw new Error("Falta SUPABASE_DB_PASSWORD (la clave de la base que se eligió al crear el proyecto).");

const correr = (cmd, a, extra = {}) => execFileSync(cmd, a, { stdio: "inherit", ...extra });
async function api(metodo, ruta, cuerpo) {
  const r = await fetch(`https://api.supabase.com${ruta}`, {
    method: metodo,
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  if (!r.ok) throw new Error(`${metodo} ${ruta} → ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}

console.log(`\n1. Migraciones en ${ref}`);
correr("supabase", ["link", "--project-ref", ref, "-p", process.env.SUPABASE_DB_PASSWORD]);
correr("supabase", ["db", "push", "-p", process.env.SUPABASE_DB_PASSWORD]);

console.log("\n2. Auth");
await api("PATCH", `/v1/projects/${ref}/config/auth`, {
  site_url: sitio,
  uri_allow_list: `${sitio}/**,http://localhost:3001/**`,
  mailer_autoconfirm: true,
  password_min_length: 8,
  rate_limit_otp: 1000,
  rate_limit_verify: 1000,
  rate_limit_token_refresh: 3000,
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_SECRET
    ? { external_google_enabled: true, external_google_client_id: process.env.GOOGLE_CLIENT_ID, external_google_secret: process.env.GOOGLE_SECRET }
    : {}),
});
const auth = await api("GET", `/v1/projects/${ref}/config/auth`);
console.log("   confirmación apagada:", auth.mailer_autoconfirm, "· límites:", auth.rate_limit_otp, auth.rate_limit_token_refresh, "· google:", auth.external_google_enabled);

const claves = await api("GET", `/v1/projects/${ref}/api-keys?reveal=true`);
const publica = claves.find((k) => k.type === "publishable")?.api_key;
const secreta = claves.find((k) => k.type === "secret")?.api_key;
if (!publica || !secreta) throw new Error("El proyecto no tiene claves publishable/secret. Crealas en Settings → API Keys.");
const url = `https://${ref}.supabase.co`;

if (!args.includes("--sin-vercel")) {
  console.log(`\n3. Variables en Vercel (${vercelEnv})`);
  const variables = {
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publica,
    SUPABASE_SECRET_KEY: secreta,
    NEXT_PUBLIC_GOOGLE_HABILITADO: auth.external_google_enabled ? "1" : "0",
    NEXT_PUBLIC_SITIO_URL: sitio,
  };
  for (const [k, v] of Object.entries(variables)) {
    try {
      execFileSync("vercel", ["env", "rm", k, vercelEnv, "--yes", "--scope", SCOPE], { stdio: "ignore" });
    } catch {
      // No existía.
    }
    execFileSync("vercel", ["env", "add", k, vercelEnv, "--scope", SCOPE], { input: v, stdio: ["pipe", "ignore", "inherit"] });
    console.log(`   ${k} ✓`);
  }
}

if (organizadores.length) {
  console.log("\n4. Organizadores");
  for (const email of organizadores) {
    const r = await fetch(`${url}/rest/v1/invitaciones?on_conflict=email,rol,evento_id,equipo_id&select=token`, {
      method: "POST",
      headers: { apikey: secreta, authorization: `Bearer ${secreta}`, "content-type": "application/json", prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ email: email.toLowerCase(), rol: "organizador" }),
    });
    const [fila] = await r.json();
    console.log(`   ${email}: ${sitio}/invitacion/${fila?.token}`);
  }
}

if (!args.includes("--sin-vercel")) {
  console.log("\n5. Redeploy de producción");
  const lista = execFileSync("vercel", ["ls", "tim", "--scope", SCOPE], { encoding: "utf8" });
  const ultimo = lista.match(/https:\/\/tim-[a-z0-9]+-programoninnovation-2426s-projects\.vercel\.app/)?.[0];
  if (!ultimo) throw new Error("No encontré el último deploy en Vercel.");
  const nuevo = execFileSync("vercel", ["redeploy", ultimo, "--target", "production", "--scope", SCOPE], { encoding: "utf8" }).trim().split("\n").pop();
  correr("vercel", ["inspect", nuevo, "--wait", "--timeout", "5m", "--scope", SCOPE]);
}

console.log(`\nListo. Siguiente: ENV_ARCHIVO=.env.prod node scripts/carga-registro.mjs 45 (y después pnpm datos:limpiar con el mismo ENV_ARCHIVO).`);
console.log(`Para .env.prod: NEXT_PUBLIC_SUPABASE_URL=${url} · claves con: supabase projects api-keys --project-ref ${ref}`);
