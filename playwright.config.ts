import { defineConfig, devices } from "@playwright/test";

// Flujos de la hackatón contra la app levantada (local por defecto; E2E_URL para otra).
// Usa las cuentas prueba- de scripts/prueba.mjs: el setup las crea y el teardown las borra.
const URL = process.env.E2E_URL ?? "http://localhost:3001";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./e2e/setup.ts",
  globalTeardown: "./e2e/teardown.ts",
  use: { baseURL: URL, trace: "retain-on-failure", locale: "es-AR" },
  projects: [{ name: "celular", use: { ...devices["iPhone 13"], browserName: "chromium" } }],
});
