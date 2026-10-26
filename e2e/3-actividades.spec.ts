import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { entrar, mail } from "./ayuda";

config({ path: ".env.local", quiet: true });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
const slugs = ["palabra", "crucigrama-1", "crucigrama-2", "crucigrama-3", "einstein-chico", "einstein-equipo"];

test("todas las tarjetas tienen solo un título tentativo y Próximamente, sin controles", async ({ page }) => {
  await entrar(page, "estudiante-1");
  await page.goto("/actividades");
  await expect(page.getByText("Títulos tentativos de actividades en preparación.")).toBeVisible();
  const lista = page.getByRole("list", { name: "Actividades próximamente" });
  await expect(lista.getByRole("listitem")).toHaveCount(6);
  await expect(lista.getByRole("heading", { level: 2 })).toHaveText(["Palabras en juego", "Conexiones", "Nuevas perspectivas", "Ideas en acción", "Decisiones", "Estrategia"]);
  await expect(lista.getByText("Próximamente", { exact: true })).toHaveCount(6);
  await expect(lista.locator("a,button,[tabindex],input,select")).toHaveCount(0);
  await expect(lista.locator('[aria-disabled="true"]')).toHaveCount(6);
  await expect(page.getByRole("navigation", { name: "Tiempo disponible" })).toHaveCount(0);
  await expect(lista.getByText(/\d+ min|Seis palabras|intentos|sillas|bebidas/)).toHaveCount(0);
});

test("ninguna actividad permite jugar desde su URL ni crea partidas", async ({ page }) => {
  test.setTimeout(60_000);
  await entrar(page, "estudiante-2");
  const { data: usuario } = await admin.from("perfiles").select("id").eq("email", mail("estudiante-2")).single();
  const contar = async () => (await admin.from("partidas").select("id", { count: "exact", head: true }).eq("usuario_id", usuario!.id)).count;
  const antes = await contar();
  for (const slug of slugs) {
    await page.goto(`/actividades/${slug}`);
    await expect(page.getByText("Esta actividad todavía no está disponible para jugar.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Empezar", exact: true })).toHaveCount(0);
  }
  expect(await contar()).toBe(antes);
});

test("los parámetros anteriores no filtran ni habilitan las propuestas", async ({ page }) => {
  await entrar(page, "estudiante-1");
  await page.goto("/actividades?min=5");
  await expect(page.getByRole("list", { name: "Actividades próximamente" }).getByText("Próximamente", { exact: true })).toHaveCount(6);
});

test("el estudiante sigue sin poder leer las soluciones guardadas", async () => {
  const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
  const login = await c.auth.signInWithPassword({ email: mail("estudiante-2"), password: process.env.PRUEBA_CLAVE ?? "prueba-tim-2026" });
  expect(login.error).toBeNull();
  expect((await c.from("partidas").select("objetivo")).error?.code).toBe("42501");
});
