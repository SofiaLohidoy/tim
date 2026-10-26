import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { entrar, mail } from "./ayuda";

config({ path: ".env.local", quiet: true });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });

test("perfil TIM: credencial con QR, página pública verificable, CV en PDF y revocación", async ({ page }) => {
  const { data: p } = await admin.from("perfiles").select("id").eq("email", mail("estudiante-3")).single();
  const { data: ev } = await admin.from("eventos").select("id").like("nombre", "prueba-%").limit(1).single();
  await admin.from("devoluciones").upsert(
    {
      evento_id: ev!.id,
      estudiante_id: p!.id,
      publicada_en: new Date().toISOString(),
      contenido: {
        version: 1,
        equipo: "prueba-Equipo 1",
        dimensiones: [{ id: "d1", nombre: "Comprensión del problema", individual: [{ quien: "mentor", nivel: "Se destaca", orden: 4, obs: "Observación privada" }], equipo: [] }],
        comentarios: [],
      },
    },
    { onConflict: "evento_id,estudiante_id" },
  );

  await entrar(page, "estudiante-3");
  await page.goto("/perfil");
  await expect(page.getByText("Tu perfil TIM")).toBeVisible();
  await expect(page.getByText("Comprensión del problema")).toBeVisible();
  await page.getByRole("button", { name: "Crear mi credencial" }).click();
  await expect(page.getByRole("img", { name: "QR de tu credencial" })).toBeVisible();
  const linkedin = await page.getByRole("link", { name: "Agregar a LinkedIn" }).getAttribute("href");
  expect(linkedin).toContain("https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME");

  const url = (await page.getByText(/\/v\/[0-9a-f-]{36}/).textContent())!.trim();
  const ruta = url.slice(url.indexOf("/v/"));

  const cv = await page.request.get("/perfil/cv");
  expect(cv.status()).toBe(200);
  expect(cv.headers()["content-type"]).toBe("application/pdf");
  expect((await cv.body()).subarray(0, 4).toString()).toBe("%PDF");

  // La página pública la ve cualquiera, sin sesión, y no muestra las observaciones textuales.
  const visitante = await page.context().browser()!.newContext();
  const publica = await visitante.newPage();
  await publica.goto(ruta);
  await expect(publica.getByText("Verificada por TIM")).toBeVisible();
  await expect(publica.getByRole("heading", { name: "Estudiante3 Prueba" })).toBeVisible();
  await expect(publica.getByText("Se destaca")).toBeVisible();
  await expect(publica.getByText("Observación privada")).toHaveCount(0);

  await page.getByRole("button", { name: "Revocar este link" }).click();
  await page.getByRole("button", { name: "Revocar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Crear mi credencial" })).toBeVisible();
  await publica.reload();
  await expect(publica.getByText("Esta credencial no está disponible.")).toBeVisible();
  await visitante.close();
});
