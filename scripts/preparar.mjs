// Arma el entorno de trabajo de TIM de una vez. Lo corre el agente; nadie tiene que saber qué hace.
//   pnpm preparar            → tim-dev listo (lo crea si no existe), esquema al día, .env.local escrito
//   pnpm preparar prod       → además escribe .env.prod (claves de producción, para reportes y limpieza)
//
// Necesita `supabase login` hecho (la persona hace un clic en el navegador). No necesita la clave
// de la base: el CLI de Supabase entra con la sesión (verificado el 26/10/2026 con CLI 2.75).
// Se puede correr las veces que haga falta: no rompe nada que ya esté bien.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const PROD = "xvzkijllizurvmmhmxvl"; // Proyecto "TIM" en la cuenta de Sofía.
const DEV = "tim-dev";
const SITIO_PROD = "https://tim-alpha-eight.vercel.app";

const sb = (args, opciones = {}) =>
  execFileSync("supabase", [...args, "--yes"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opciones });
const json = (args) => JSON.parse(sb([...args, "-o", "json"]));
const paso = (t) => console.log(`\n▸ ${t}`);
const azar = () => randomBytes(24).toString("base64url");

function leerEnv(archivo) {
  if (!existsSync(archivo)) return {};
  return Object.fromEntries(
    readFileSync(archivo, "utf8")
      .split("\n")
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
  );
}

function escribirEnv(archivo, valores, encabezado) {
  const cuerpo = Object.entries(valores).map(([k, v]) => `${k}=${v}`).join("\n");
  writeFileSync(archivo, `# ${encabezado}\n# Lo escribe scripts/preparar.mjs. No se sube al repo.\n${cuerpo}\n`);
}

function claves(ref) {
  const lista = json(["projects", "api-keys", "--project-ref", ref]);
  const valor = (tipo) => lista.find((k) => k.type === tipo)?.api_key;
  const publica = valor("publishable");
  const secreta = valor("secret");
  if (!publica || !secreta) throw new Error(`El proyecto ${ref} no tiene claves publishable y secret (Supabase → Settings → API Keys).`);
  return { publica, secreta };
}

// 1. Sesión de Supabase.
paso("Sesión de Supabase");
let proyectos;
try {
  proyectos = json(["projects", "list"]);
} catch {
  console.error("No hay sesión de Supabase. Corré `supabase login` (se abre el navegador para un clic) y volvé a correr `pnpm preparar`.");
  process.exit(1);
}
const prod = proyectos.find((p) => (p.id ?? p.ref) === PROD);
if (!prod) {
  console.error("Esta cuenta de Supabase no ve el proyecto TIM. Entrá con la cuenta de Sofía (`supabase login`).");
  process.exit(1);
}
console.log("  ok");

// 2. tim-dev: existe o se crea.
paso("Base de desarrollo (tim-dev)");
let dev = proyectos.find((p) => p.name === DEV);
if (!dev) {
  console.log("  No existe: la creo (tarda unos 2 minutos).");
  sb(["projects", "create", DEV, "--org-id", prod.organization_id, "--region", prod.region ?? "us-east-2", "--db-password", azar()]);
}
for (let i = 0; i < 60; i++) {
  dev = json(["projects", "list"]).find((p) => p.name === DEV);
  if (dev?.status === "ACTIVE_HEALTHY") break;
  await new Promise((r) => setTimeout(r, 10_000));
}
if (dev?.status !== "ACTIVE_HEALTHY") throw new Error("tim-dev no quedó activo en 10 minutos. Mirá el estado en supabase.com y volvé a correr.");
const refDev = dev.id ?? dev.ref;
console.log(`  ok (${refDev})`);

// 3. Esquema y Auth en tim-dev.
paso("Esquema y configuración de Auth en tim-dev");
sb(["link", "--project-ref", refDev]);
sb(["db", "push"]);
sb(["config", "push", "--project-ref", refDev]);
console.log("  ok: migraciones aplicadas, confirmación de mail apagada, URL local");

// 4. .env.local apuntando a tim-dev.
paso(".env.local");
const previo = leerEnv(".env.local");
const kDev = claves(refDev);
escribirEnv(
  ".env.local",
  {
    NEXT_PUBLIC_SUPABASE_URL: `https://${refDev}.supabase.co`,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: kDev.publica,
    SUPABASE_SECRET_KEY: kDev.secreta,
    NEXT_PUBLIC_SITIO_URL: "http://localhost:3001",
    NEXT_PUBLIC_GOOGLE_HABILITADO: "0",
    NEXT_PUBLIC_ACTIVIDADES: "1",
    LANDING_SAL: previo.LANDING_SAL || azar(),
    CRON_SECRET: previo.CRON_SECRET || azar(),
    PRUEBA_CLAVE: previo.PRUEBA_CLAVE || "prueba-tim-2026",
  },
  "Desarrollo: base tim-dev.",
);
console.log("  ok");

// 5. Opcional: .env.prod para reportes y limpieza de datos de prueba en producción.
if (process.argv[2] === "prod") {
  paso(".env.prod (producción)");
  const kProd = claves(PROD);
  escribirEnv(
    ".env.prod",
    {
      NEXT_PUBLIC_SUPABASE_URL: `https://${PROD}.supabase.co`,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: kProd.publica,
      SUPABASE_SECRET_KEY: kProd.secreta,
      NEXT_PUBLIC_SITIO_URL: SITIO_PROD,
      PRUEBA_CLAVE: previo.PRUEBA_CLAVE || "prueba-tim-2026",
    },
    "PRODUCCIÓN. Usar con ENV_ARCHIVO=.env.prod. Nunca para desarrollar.",
  );
  console.log("  ok");
}

console.log("\nListo. Siguiente: pnpm dev (puerto 3001).");
