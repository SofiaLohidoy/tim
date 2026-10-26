import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { CLAVE, entrar, mail, salir } from "./ayuda";

config({ path: ".env.local", quiet: true });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});

test.describe.configure({ mode: "serial" });

test("registro desde el QR de la puerta: cuenta, onboarding en 3 pasos y asistencia", async ({ page }) => {
  const { data: ev } = await admin.from("eventos").select("id").neq("estado", "cerrado").order("fecha").limit(1).single();
  await admin.from("codigos_asistencia").upsert({ evento_id: ev!.id, codigo: "QRTEST", rotado_en: new Date().toISOString() });

  await page.goto("/a/QRTEST");
  await expect(page).toHaveURL(/\/ingresar/);
  await page.getByLabel("Mail").fill(mail("nuevo"));
  await page.getByLabel("Contraseña", { exact: true }).fill(CLAVE);
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();

  await expect(page.getByRole("heading", { name: "Tus datos" })).toBeVisible();
  await page.getByLabel("Nombre", { exact: true }).fill("Nuevo");
  await page.getByLabel("Apellido", { exact: true }).fill("Prueba");
  await page.getByLabel("Universidad", { exact: true }).fill("prueba-UTDT");
  await page.getByLabel("Carrera", { exact: true }).fill("prueba-Economía");
  await page.getByRole("button", { name: "4.º" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Seguir" }).click();

  await expect(page.getByRole("heading", { name: "Qué te interesa" })).toBeVisible();
  await page.getByRole("button", { name: "Finanzas" }).click();
  await page.getByRole("button", { name: "Quiero mostrar lo que sé hacer" }).click();
  await page.getByRole("button", { name: "Seguir" }).click();

  await expect(page.getByRole("heading", { name: "Tu punto de partida" })).toBeVisible();
  for (const respuesta of ["Sí", "Sí", "No"]) {
    await page.getByRole("button", { name: respuesta, exact: true }).last().click();
  }
  await expect(page.getByText("Te falta mostrarlo")).toBeVisible();
  await page.getByRole("button", { name: "Listo, entrar" }).click();

  await expect(page).toHaveURL(/\/inicio/);
  await expect(page.getByText("Estuviste ahí.")).toBeVisible();

  const { data: perfil } = await admin.from("perfiles").select("id").eq("email", mail("nuevo")).single();
  const { data: e } = await admin.from("estudiantes").select("arquetipo").eq("usuario_id", perfil!.id).single();
  expect(e!.arquetipo).toBe("no_sabe_demostrar");
});

test("el mentor evalúa a una persona con la rúbrica y la envía", async ({ page }) => {
  await salir(page);
  await entrar(page, "mentor-1");
  await expect(page).toHaveURL(/\/mentor/);
  await expect(page.getByRole("heading", { name: "prueba-Equipo 1" })).toBeVisible();
  await page.getByRole("link", { name: /Estudiante1 Prueba/ }).click();
  await expect(page.getByRole("heading", { name: "Estudiante1 Prueba" })).toBeVisible();

  const grupos = page.getByRole("radiogroup");
  const cantidad = await grupos.count();
  expect(cantidad).toBe(4);
  for (let i = 0; i < cantidad; i++) await grupos.nth(i).getByRole("radio").nth(2).click();
  await page.getByRole("button", { name: "Agregar observación" }).first().click();
  await page.getByRole("textbox", { name: /Observación sobre/ }).first().fill("Hizo las preguntas que ordenaron al equipo.");
  await expect(page.getByText("Borrador guardado")).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /^Enviar y/ }).click();
  await expect(page).toHaveURL(/\/mentor\/[^/]+\/[^/]+$/);

  await page.goto(page.url().replace(/\/[^/]+$/, ""));
  await expect(page.getByText("Enviada").first()).toBeVisible();
});

test("el organizador prepara y publica; el estudiante ve su devolución y responde la encuesta", async ({ page }) => {
  await salir(page);
  await entrar(page, "organizador");
  await page.goto("/organizador/devoluciones");
  await page.getByRole("button", { name: "Preparar devoluciones" }).click();
  await expect(page.getByText(/devoluciones preparadas/)).toBeVisible();
  await page.getByRole("button", { name: "Publicar a los estudiantes" }).click();
  await page.getByRole("button", { name: "Sí, publicar" }).click();
  await expect(page.getByText(/Publicadas/).first()).toBeVisible();

  await salir(page);
  await entrar(page, "estudiante-1");
  await page.goto("/devolucion");
  await expect(page.getByRole("heading", { name: "Lo que observaron de vos" })).toBeVisible();
  await expect(page.getByText("Hizo las preguntas que ordenaron al equipo.")).toBeVisible();
  for (const [i, r] of [["0", "Sí"], ["1", "Sí"], ["2", "Tal vez"]] as const) {
    await page.getByRole("group").nth(Number(i)).getByRole("button", { name: r, exact: true }).click();
  }
  await page.getByRole("button", { name: "Enviar respuestas" }).click();
  await expect(page.getByText("Gracias. Nos ayuda un montón.")).toBeVisible();
});
