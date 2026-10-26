import { execSync } from "node:child_process";

// Corre el script como proceso aparte: es ESM y Playwright transpila los TS a CommonJS.
export default async function setup() {
  execSync("node scripts/prueba.mjs limpiar && node scripts/prueba.mjs crear --estudiantes 4 --equipos 2", { stdio: "inherit" });
}
