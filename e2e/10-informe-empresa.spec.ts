import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { gzipSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });

test("guardar el nombre de la empresa habilita solo su informe privado", async ({ page, context }) => {
  test.setTimeout(120_000);
  const suf = randomUUID(), nombre = `prueba-Lisa-${suf}`, ruta = `prueba-${suf}/informe.html.gz`;
  const email = "prueba-informe-e2e@tim.test", password = randomBytes(24).toString("base64url");
  const cuenta = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { given_name: "prueba-Empresa" } });
  expect(cuenta.error).toBeNull(); const uid = cuenta.data.user!.id;
  let id: string | undefined;
  try {
    const insert = await admin.from("informes_empresa").insert({ empresa_clave: nombre.toLowerCase(), titulo: "prueba-Devolución de la hackatón", archivo_ruta: ruta }).select("id").single();
    expect(insert.error).toBeNull(); id = insert.data!.id;
    const html = '<!doctype html><html lang="es"><title>prueba-Informe ficticio</title><h1>prueba-Informe ficticio</h1><button onclick="this.textContent=\'prueba-Mapa abierto\'">prueba-Explorar mapa</button></html>';
    expect((await admin.storage.from("informes-empresa").upload(ruta, gzipSync(html), { contentType: "application/gzip" })).error).toBeNull();
    expect((await page.request.get(`/empresa/informes/${id}`)).status()).toBe(401);
    await page.goto("/ingresar?siguiente=%2Fempresa");
    await page.getByRole("tab", { name: "Ya tengo cuenta", exact: true }).click();
    await page.getByLabel("Mail", { exact: true }).fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Completá tu empresa", exact: true })).toBeVisible();
    expect((await page.request.get(`/empresa/informes/${id}`)).status()).toBe(404);
    await page.getByLabel("Nombre de la empresa").fill(`  ${nombre.toUpperCase()}  `);
    await page.getByLabel("Rubro").fill("prueba-Tecnología");
    await page.getByLabel("Personas en la empresa").selectOption("1-9");
    await page.getByRole("button", { name: "Guardar mi empresa", exact: true }).click();
    await expect(page.getByRole("heading", { name: "prueba-Devolución de la hackatón", exact: true })).toBeVisible();
    const response = await page.request.get(`/empresa/informes/${id}`);
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["content-security-policy"]).toContain("sandbox allow-scripts");
    expect(response.headers()["content-security-policy"]).not.toContain("allow-same-origin");
    expect((await response.body()).toString()).toContain("prueba-Informe ficticio");
    const popupPromise = context.waitForEvent("page");
    await page.getByRole("link", { name: "Ver devolución", exact: true }).click();
    const popup = await popupPromise;
    await expect(popup.getByRole("heading", { name: "prueba-Informe ficticio" })).toBeVisible();
    await popup.getByRole("button", { name: "prueba-Explorar mapa" }).click();
    await expect(popup.getByRole("button", { name: "prueba-Mapa abierto" })).toBeVisible();
    expect(await popup.evaluate(() => { try { return document.cookie; } catch { return "aislado"; } })).toBe("aislado");
    await popup.close();
    execFileSync(process.execPath, ["scripts/capturas.mjs", "/empresa"], { stdio: "inherit", env: { ...process.env, CAPTURAS_COMO: "informe-e2e", PRUEBA_CLAVE: password } });
    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 812 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.getByRole("button", { name: "Editar mi empresa", exact: true }).click();
    await page.getByLabel("Nombre de la empresa").fill("prueba-Otra empresa");
    await page.getByRole("button", { name: "Guardar mi empresa", exact: true }).click();
    await expect(page.getByRole("link", { name: "Ver devolución", exact: true })).toHaveCount(0);
    expect((await page.request.get(`/empresa/informes/${id}`)).status()).toBe(404);
  } finally {
    await admin.storage.from("informes-empresa").remove([ruta]);
    if (id) await admin.from("informes_empresa").delete().eq("id", id).like("empresa_clave", "prueba-%");
    await admin.auth.admin.deleteUser(uid);
  }
});
