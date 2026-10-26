import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Tests de RLS: corren contra el Supabase local (supabase start) con cuentas prueba-.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.rls.test.ts"], testTimeout: 30_000, hookTimeout: 60_000, fileParallelism: false },
});
