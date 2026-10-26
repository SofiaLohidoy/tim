import { test, expect as baseExpect } from "@playwright/test";
import { config } from "dotenv";
import { entrar } from "./ayuda";

config({ path: ".env.local", quiet: true });
// Estos recorridos incluyen varias páginas y dos autenticaciones contra tim-dev.
test.describe.configure({ timeout: 90_000 });
const expect = baseExpect.configure({ timeout: 15_000 });

test("la landing ofrece registro directo y dos páginas informativas", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Quiero demostrar mi talento", exact: true }).first()).toHaveAttribute("href", "/ingresar?tipo=estudiante");
  await expect(page.getByRole("link", { name: "Quiero contratar talento", exact: true }).first()).toHaveAttribute("href", "/ingresar?tipo=empresa");
  await expect(page.locator("form")).toHaveCount(0);
  for (const ruta of ["/estudiantes", "/empresas"]) {
    await page.goto(ruta);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("form")).toHaveCount(0);
    await expect(page.getByText(/talento junior/i)).toHaveCount(0);
  }
  await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Ya tengo cuenta" })).toHaveAttribute("aria-selected", "true");
});

test("una empresa se registra, guarda su perfil y vuelve a su espacio al ingresar", async ({ page }) => {
  const email = "prueba-empresa-web@tim.test";
  await page.goto("/ingresar?tipo=empresa");
  await expect(page.getByRole("heading", { name: "Creá tu cuenta de empresa." })).toBeVisible();
  await page.getByLabel("Mail", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(process.env.PRUEBA_CLAVE ?? "prueba-tim-2026");
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(page).toHaveURL(/\/empresa$/);
  await page.getByLabel("Nombre de la empresa").fill("prueba-Equipo TIM");
  await page.getByLabel("Rubro", { exact: false }).fill("Tecnología");
  await page.getByLabel("Personas en la empresa").selectOption("10-49");
  await page.getByRole("button", { name: "Guardar mi empresa", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("quedó guardado");
  await expect(page.getByRole("heading", { name: "prueba-Equipo TIM" })).toBeVisible();
  await page.getByRole("button", { name: "Editar mi empresa" }).click();
  await page.getByLabel("Rubro", { exact: false }).fill("Servicios");
  await page.getByRole("button", { name: "Guardar mi empresa", exact: true }).click();
  await expect(page.getByText("Servicios · 10-49 personas")).toBeVisible();
  await page.getByRole("button", { name: "Salir", exact: true }).click();
  await page.getByRole("tab", { name: "Ya tengo cuenta" }).click();
  await page.getByLabel("Mail", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(process.env.PRUEBA_CLAVE ?? "prueba-tim-2026");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/empresa$/);
  await expect(page.getByRole("heading", { name: "Tu empresa ya está en TIM." })).toBeVisible();
});

test("el inicio muestra el logo completo y organización conserva el menú lateral", async ({ page }) => {
  await entrar(page, "estudiante-1");
  await page.goto("/inicio");
  const logo = page.locator("header").getByRole("img", { name: "TIM", exact: true });
  await expect(logo).toBeVisible();
  expect((await logo.boundingBox())!.width).toBeGreaterThan(50);
  await page.goto("/perfil");
  await page.getByRole("button", { name: "Salir", exact: true }).click();
  await page.waitForURL("**/ingresar");
  await entrar(page, "organizador");
  await page.getByRole("button", { name: "Abrir menú de organización" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Equipos", exact: true }).click();
  await expect(page).toHaveURL(/\/organizador\/equipos$/);
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByRole("complementary", { name: "Organización", exact: true })).toBeVisible();
});
