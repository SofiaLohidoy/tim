import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { entrar, mail } from "./ayuda";

config({ path: ".env.local", quiet: true });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });

// Corre antes que 2-hackaton (que publica las devoluciones y cierra las evaluaciones). Usa el
// mentor 2 (equipo 2: estudiantes 2 y 4) para no mezclarse con el mentor 1.
// El wifi del lugar puede fallar: lo que el mentor marca sin señal queda en el celular y sube solo
// cuando vuelve la conexión, aunque cierre y vuelva a abrir la pantalla.
test("el mentor evalúa sin señal y se sincroniza al volver la conexión", async ({ page, context }) => {
  await entrar(page, "mentor-2");
  await page.getByRole("link", { name: /Estudiante2 Prueba/ }).click();
  const persona = (await page.getByRole("heading", { level: 1 }).textContent())!.trim();
  await expect(page.getByRole("radiogroup").first()).toBeVisible();

  await context.setOffline(true);
  await page.getByRole("radiogroup").nth(0).getByRole("radio").nth(3).click();
  await page.getByRole("radiogroup").nth(1).getByRole("radio").nth(1).click();
  await expect(page.getByText("Guardado en el celular")).toBeVisible({ timeout: 10_000 });

  await context.setOffline(false);
  await expect(page.getByText("Borrador guardado")).toBeVisible({ timeout: 30_000 });

  const { data: p } = await admin.from("perfiles").select("id").eq("email", mail("mentor-2")).single();
  const { data: evals } = await admin.from("evaluaciones").select("respuestas, estudiante_id").eq("evaluador_id", p!.id);
  expect(evals!.length).toBe(1);
  expect(Object.values(evals![0].respuestas as Record<string, { nivel: string | null }>).filter((r) => r.nivel)).toHaveLength(2);
  expect(persona.length).toBeGreaterThan(0);
});

test("lo marcado sin señal sobrevive a cerrar la pantalla y se sube al volver", async ({ page, context }) => {
  await entrar(page, "mentor-2");
  await page.getByRole("link", { name: /Estudiante4 Prueba/ }).click();
  await expect(page).toHaveURL(/\/mentor\/[^/]+\/[^/]+$/);
  const url = page.url();
  await expect(page.getByRole("radiogroup").first()).toBeVisible();

  await context.setOffline(true);
  await page.getByRole("radiogroup").nth(2).getByRole("radio").nth(2).click();
  await expect(page.getByText("Guardado en el celular")).toBeVisible({ timeout: 10_000 });
  await page.goto("about:blank");

  await context.setOffline(false);
  await page.goto(url);
  await expect(page.getByText("Borrador guardado")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("radiogroup").nth(2).getByRole("radio").nth(2)).toHaveAttribute("aria-checked", "true");
});

test("Enviar sin señal no queda en borrador: se envía solo al volver la conexión", async ({ page, context }) => {
  await entrar(page, "mentor-2");
  await page.getByRole("link", { name: /Estudiante2 Prueba/ }).click();
  await expect(page).toHaveURL(/\/mentor\/[^/]+\/[^/]+$/);
  const grupos = page.getByRole("radiogroup");
  await expect(grupos.first()).toBeVisible();

  await context.setOffline(true);
  for (let i = 0; i < (await grupos.count()); i++) await grupos.nth(i).getByRole("radio").nth(1).click();
  await page.getByRole("button", { name: /Enviar y|Guardar cambios y/ }).click();
  await expect(page.getByText(/se envía solo cuando vuelva la señal/)).toBeVisible({ timeout: 10_000 });

  await context.setOffline(false);
  await expect(page.getByText("Enviada")).toBeVisible({ timeout: 30_000 });
  const { data: p } = await admin.from("perfiles").select("id").eq("email", mail("mentor-2")).single();
  const { data: est } = await admin.from("perfiles").select("id").eq("email", mail("estudiante-2")).single();
  const { data: e } = await admin.from("evaluaciones").select("estado").eq("evaluador_id", p!.id).eq("estudiante_id", est!.id).single();
  expect(e!.estado).toBe("enviada");
});
