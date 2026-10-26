import { expect, type Page } from "@playwright/test";

export const CLAVE = process.env.PRUEBA_CLAVE ?? "prueba-tim-2026";
export const mail = (quien: string) => `prueba-${quien}@tim.test`;

export async function entrar(page: Page, quien: string, siguiente?: string) {
  await page.goto(siguiente ? `/ingresar?siguiente=${encodeURIComponent(siguiente)}` : "/ingresar");
  await page.getByRole("tab", { name: "Ya tengo cuenta" }).click();
  await page.getByLabel("Mail").fill(mail(quien));
  await page.getByLabel("Contraseña", { exact: true }).fill(CLAVE);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).not.toHaveURL(/\/ingresar/);
}

export async function salir(page: Page) {
  await page.context().clearCookies();
}
