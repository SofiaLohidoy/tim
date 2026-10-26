// Saca capturas de pantallas de TIM a 375 px (celular) y 1280 px (compu) en capturas/, para
// mirarlas antes de dar algo por terminado. Entra con una cuenta prueba- si se le pasa.
//   pnpm capturas                       → rutas por defecto, como prueba-organizador
//   pnpm capturas /inicio /perfil       → esas rutas
//   CAPTURAS_COMO=estudiante-1 pnpm capturas /inicio
//   CAPTURAS_URL=https://tim-alpha-eight.vercel.app pnpm capturas /
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { config } from "dotenv";

config({ path: process.env.ENV_ARCHIVO ?? ".env.local", quiet: true });
const base = process.env.CAPTURAS_URL ?? "http://localhost:3001";
const como = process.env.CAPTURAS_COMO ?? "organizador";
const rutas = process.argv.slice(2).length ? process.argv.slice(2) : ["/", "/ingresar", "/organizador", "/organizador/equipos", "/organizador/personas"];
const anchos = [
  { nombre: "375", viewport: { width: 375, height: 812 }, isMobile: true, deviceScaleFactor: 2 },
  { nombre: "1280", viewport: { width: 1280, height: 800 }, isMobile: false, deviceScaleFactor: 1 },
];

mkdirSync("capturas", { recursive: true });
const navegador = await chromium.launch();
for (const a of anchos) {
  const ctx = await navegador.newContext({ viewport: a.viewport, isMobile: a.isMobile, deviceScaleFactor: a.deviceScaleFactor, locale: "es-AR" });
  const page = await ctx.newPage();
  if (rutas.some((r) => !["/", "/ingresar", "/estudiantes", "/empresas", "/l/a", "/l/b"].includes(r.split("?")[0]) && !r.startsWith("/v/"))) {
    await page.goto(`${base}/ingresar`);
    await page.getByRole("tab", { name: "Ya tengo cuenta" }).click();
    await page.getByLabel("Mail").fill(`prueba-${como}@tim.test`);
    await page.getByLabel("Contraseña", { exact: true }).fill(process.env.PRUEBA_CLAVE ?? "prueba-tim-2026");
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL((u) => !u.pathname.startsWith("/ingresar"), { timeout: 15_000 }).catch(() => {
      console.error(`No pude entrar como prueba-${como}. ¿Corriste pnpm datos:prueba?`);
    });
  }
  for (const r of rutas) {
    await page.goto(`${base}${r}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const archivo = `capturas/${r.replace(/[^a-zA-Z0-9_-]/g, "_") || "_"}-${a.nombre}.png`;
    await page.screenshot({ path: archivo, fullPage: true });
    console.log(archivo);
  }
  await ctx.close();
}
await navegador.close();
