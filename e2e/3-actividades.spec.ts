import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { entrar, mail } from "./ayuda";

config({ path: ".env.local", quiet: true });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
// Misma lista y orden que src/lib/actividades/soluciones.ts (se genera ordenada desde este archivo).
const PALABRAS = [...new Set(readFileSync("scripts/contenido/palabras.txt", "utf8").split(/\s+/).filter(Boolean))].sort();

async function senales(quien: string, actividad: string) {
  const { data: p } = await admin.from("perfiles").select("id").eq("email", mail(quien)).single();
  const { data: part } = await admin.from("partidas").select("id, resultado").eq("usuario_id", p!.id).eq("actividad", actividad).order("iniciada_en", { ascending: false }).limit(1).single();
  const { data: s } = await admin.from("senales").select("clave, valor").eq("partida_id", part!.id);
  return { resultado: part!.resultado, senales: Object.fromEntries((s ?? []).map((x) => [x.clave, Number(x.valor)])) };
}

async function empezar(page: Page, titulo: RegExp) {
  await page.goto("/actividades");
  await page.getByRole("link", { name: titulo }).click();
  await page.getByRole("button", { name: "Empezar" }).click();
}

test.describe.configure({ mode: "serial" });

test("adivinar la palabra: un intento errado, después la correcta; señales y encuesta", async ({ page }) => {
  await entrar(page, "estudiante-1");
  await empezar(page, /Adivinar la palabra/);
  await expect(page.getByLabel("Teclado")).toBeVisible();

  const { data: p } = await admin.from("perfiles").select("id").eq("email", mail("estudiante-1")).single();
  const { data: partida } = await admin.from("partidas").select("objetivo").eq("usuario_id", p!.id).eq("resultado", "en_curso").single();
  const objetivo = PALABRAS[(partida!.objetivo as { indice: number }).indice];
  const errada = objetivo === "MUNDO" ? "PLAYA" : "MUNDO";

  await page.keyboard.type(errada);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("gridcell", { name: /^[A-Z], (en su lugar|en otro lugar|no está)$/ }).first()).toBeVisible();
  for (const l of objetivo) await page.getByRole("button", { name: l, exact: true }).click();
  await page.getByRole("button", { name: "Enviar", exact: true }).click();

  await expect(page.getByText("¡Lo resolviste!")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Persistencia")).toBeVisible();
  await expect(page.getByText("Uso de la información")).toBeVisible();
  await page.getByRole("button", { name: "Sí", exact: true }).click();
  await expect(page.getByText("Gracias.")).toBeVisible();

  const r = await senales("estudiante-1", "palabra");
  expect(r.resultado).toBe("resuelta");
  expect(r.senales.persistencia).toBe(1);
  expect(r.senales.uso_de_informacion).toBe(1);
});

test("mini crucigrama: comprobar con un error, corregir y resolver", async ({ page }) => {
  await entrar(page, "estudiante-1");
  await empezar(page, /la mochila/);
  const solucion = ["BOLSA", "R#E#U", "USTED", "J#R#I", "ALAMO"];
  const escribir = async (f: number, k: number, l: string) => {
    await page.getByRole("gridcell", { name: new RegExp(`^fila ${f + 1}, columna ${k + 1}(,|$)`) }).click();
    await page.keyboard.type(l);
  };
  for (let f = 0; f < 5; f++) for (let k = 0; k < 5; k++) if (solucion[f][k] !== "#") await escribir(f, k, f === 0 && k === 0 ? "X" : solucion[f][k]);
  await page.getByRole("button", { name: "Comprobar" }).click();
  await expect(page.getByText("1 casillero está mal (marcados).")).toBeVisible();
  await escribir(0, 0, "B");
  await page.getByRole("button", { name: "Comprobar" }).click();
  await expect(page.getByText("¡Lo resolviste!")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Autocorrección")).toBeVisible();

  const r = await senales("estudiante-1", "crucigrama-1");
  expect(r.senales).toEqual({ persistencia: 1, autocorreccion: 1 });
});

test("acertijo de Einstein: comprobar con errores y resolver", async ({ page }) => {
  await entrar(page, "estudiante-2");
  await empezar(page, /tres en la mesa/);
  const silla = (n: number) => page.locator("section", { hasText: `Silla ${n}` });
  const poner = async (n: number, cat: string, v: string) => silla(n).getByLabel(cat).selectOption(v);
  await poner(1, "Persona", "Ana");
  await page.getByRole("button", { name: "Comprobar" }).click();
  await expect(page.getByText(/1 casillero está mal y faltan 8/)).toBeVisible();

  const sol: Record<string, string[]> = { Persona: ["Bruno", "Ana", "Carla"], Rol: ["datos", "pitch", "diseño"], Bebida: ["té", "mate", "café"] };
  for (const [cat, vals] of Object.entries(sol)) for (let i = 0; i < 3; i++) await poner(i + 1, cat, vals[i]);
  await page.getByRole("button", { name: "Comprobar" }).click();
  await expect(page.getByText("¡Lo resolviste!")).toBeVisible({ timeout: 10_000 });

  const r = await senales("estudiante-2", "einstein-chico");
  expect(r.resultado).toBe("resuelta");
  expect(r.senales).toEqual({ persistencia: 1, autocorreccion: 1 });
});

test("el estudiante no puede leer la palabra objetivo de su partida", async ({ page }) => {
  await entrar(page, "estudiante-2");
  const res = await page.evaluate(async () => {
    const r = await fetch("/actividades");
    return r.status;
  });
  expect(res).toBe(200);
  const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
  await c.auth.signInWithPassword({ email: mail("estudiante-2"), password: process.env.PRUEBA_CLAVE ?? "prueba-tim-2026" });
  const { error } = await c.from("partidas").select("objetivo");
  expect(error?.code).toBe("42501");
  const { data } = await c.from("partidas").select("id, resultado");
  expect((data ?? []).length).toBeGreaterThan(0);
});
