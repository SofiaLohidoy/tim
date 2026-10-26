import { execSync } from "node:child_process";

export default async function teardown() {
  if (process.env.E2E_CONSERVAR) return;
  execSync("node scripts/prueba.mjs limpiar", { stdio: "inherit" });
}
