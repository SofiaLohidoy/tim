import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { CLAVE, entrar, salir } from "./ayuda";
config({ path: ".env.local", quiet: true });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });

test("organizador y jurado asignado ven la entrega; sin asignación el jurado no la ve", async ({ page }) => {
  const equipos = await admin.from("equipos").select("id,entrega_url").like("nombre", "prueba-Equipo %").order("nombre");
  const equipo = equipos.data![0];
  const link = "https://example.com/prueba-entrega";
  const asignacion = (await admin.from("asignaciones").select("*").eq("equipo_id", equipo.id).eq("rol", "jurado").single()).data!;
  await admin.from("equipos").update({ entrega_url: link }).eq("id", equipo.id);
  try {
    await entrar(page, "organizador");
    await page.goto("/organizador/equipos");
    await expect(page.getByRole("link", { name: "Ver entrega de prueba-Equipo 1", exact: true })).toHaveAttribute("href", link);
    await salir(page);
    await entrar(page, "jurado");
    await expect(page.getByRole("link", { name: "Ver entrega de prueba-Equipo 1", exact: true })).toHaveAttribute("href", link);
    await page.goto(`/jurado/${equipo.id}`);
    await expect(page.getByRole("link", { name: "Ver la entrega", exact: true })).toHaveAttribute("href", link);
    await admin.from("asignaciones").delete().eq("id", asignacion.id);
    await page.goto(`/jurado/${equipo.id}`);
    await expect(page.getByRole("link", { name: "Ver la entrega", exact: true })).toHaveCount(0);
    await page.goto("/jurado");
    await expect(page.getByRole("link", { name: "Ver entrega de prueba-Equipo 1", exact: true })).toHaveCount(0);
    const jurado = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
    await jurado.auth.signInWithPassword({ email: "prueba-jurado@tim.test", password: CLAVE });
    expect((await jurado.from("equipos").select("entrega_url").eq("id", equipo.id)).data).toEqual([]);
  } finally {
    await admin.from("equipos").update({ entrega_url: equipo.entrega_url }).eq("id", equipo.id);
    await admin.from("asignaciones").upsert(asignacion);
  }
});

test("Delete exige confirmación, respalda el CV y elimina solo la cuenta elegida", async ({ page }) => {
  const email = "prueba-delete-persona@tim.test";
  const cuenta = await admin.auth.admin.createUser({ email, password: CLAVE, email_confirm: true, user_metadata: { given_name: "prueba-Eliminar", family_name: "Persona" } });
  expect(cuenta.error).toBeNull();
  const id = cuenta.data.user!.id;
  const cv = "%PDF-1.4 prueba-CV descartable";
  const plantilla = (await admin.from("estudiantes").select("*").limit(1).single()).data!;
  await admin.from("estudiantes").insert({ ...plantilla, usuario_id: id, cv_path: `${id}/cv.pdf` });
  await admin.storage.from("cvs").upload(`${id}/cv.pdf`, Buffer.from(cv), { contentType: "application/pdf" });
  try {
    await entrar(page, "organizador");
    await page.goto(`/organizador/personas?persona=${id}`);
    await page.getByRole("button", { name: "Delete: prueba-Eliminar Persona", exact: true }).click();
    const dialogo = page.getByRole("dialog");
    await expect(dialogo.getByRole("button", { name: "Eliminar cuenta y datos", exact: true })).toBeDisabled();
    await dialogo.getByRole("button", { name: "Cancelar", exact: true }).click();
    expect((await admin.auth.admin.getUserById(id)).data.user?.id).toBe(id);
    await page.getByRole("button", { name: "Delete: prueba-Eliminar Persona", exact: true }).click();
    await dialogo.getByLabel("Mail para confirmar eliminación").fill(email);
    await dialogo.getByRole("button", { name: "Eliminar cuenta y datos", exact: true }).click();
    await expect(page.getByText("Cuenta y datos eliminados. Se guardó un respaldo privado.", { exact: true })).toBeVisible();
    await expect(dialogo).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Delete: prueba-Eliminar Persona", exact: true })).toHaveCount(0);
    expect((await admin.auth.admin.getUserById(id)).data.user).toBeNull();
    expect((await admin.from("estudiantes").select("usuario_id").eq("usuario_id", id)).data).toEqual([]);
    const respaldo = await admin.from("respaldos_eliminacion").select("datos,cv_base64").eq("usuario_id", id).single();
    expect(respaldo.data?.cv_base64).toBe(Buffer.from(cv).toString("base64"));
    expect(respaldo.data?.datos.perfiles[0].email).toBe(email);
    expect((await admin.storage.from("cvs").list(id)).data).toEqual([]);
    expect((await admin.from("perfiles").select("id").eq("email","prueba-estudiante-1@tim.test").single()).data?.id).toBeTruthy();
  } finally {
    await admin.storage.from("cvs").remove([`${id}/cv.pdf`]);
    await admin.auth.admin.deleteUser(id);
    await admin.from("respaldos_eliminacion").delete().eq("usuario_id", id);
  }
});

test("la carga de archivo llega a Entregas y al jurado y no queda accesible para otro equipo", async ({page})=>{
  test.setTimeout(60_000); // Incluye cuatro ingresos, dos descargas, capturas y eliminación con respaldo.
  const eq=(await admin.from("equipos").select("id,evento_id").like("nombre","prueba-Equipo 1").single()).data!;
  const autor=(await admin.from("perfiles").select("id").eq("email","prueba-estudiante-1@tim.test").single()).data!;
  let ruta: string|undefined;
  try {
    await entrar(page,"estudiante-1");
    await page.goto("/inicio");
    await page.getByLabel("Archivo de la entrega del equipo",{exact:true}).setInputFiles({name:"prueba-presentacion.pdf",mimeType:"application/pdf",buffer:Buffer.from("%PDF-1.4 prueba-presentacion")});
    await expect(page.getByText("Entrega guardada. La ven el organizador y tu jurado.",{exact:true})).toBeVisible();
    ruta=(await admin.from("entregas_equipo").select("archivo_path").eq("equipo_id",eq.id).single()).data!.archivo_path;
    await salir(page);await entrar(page,"organizador");await page.goto(`/organizador/entregas?evento=${eq.evento_id}`);
    await expect(page.getByText("prueba-presentacion.pdf",{exact:true})).toBeVisible();
    const respuesta=await page.request.get(`/entregas/${eq.id}`);
    expect(respuesta.status()).toBe(200);expect((await respuesta.body()).toString()).toContain("prueba-presentacion");
    for(const width of [375,1280]){await page.setViewportSize({width,height:812});await page.screenshot({path:`capturas/entregas-archivo-${width}.png`,fullPage:true});}
    await salir(page);await entrar(page,"jurado");
    await expect(page.getByRole("link",{name:"Ver archivo de prueba-Equipo 1",exact:true})).toBeVisible();
    expect((await page.request.get(`/entregas/${eq.id}`)).status()).toBe(200);
    for(const width of [375,1280]){await page.setViewportSize({width,height:812});await page.screenshot({path:`capturas/jurado-archivo-${width}.png`,fullPage:true});}
    await salir(page);await entrar(page,"estudiante-2");
    expect((await page.request.get(`/entregas/${eq.id}`)).status()).toBe(404);
    const denegada=await page.request.post("/api/entregas",{headers:{Origin:new URL(page.url()).origin},multipart:{equipo:eq.id,archivo:{name:"prueba-intrusion.pdf",mimeType:"application/pdf",buffer:Buffer.from("%PDF-1.4 prueba")}}});
    expect(denegada.status()).toBe(403);
    await salir(page);await entrar(page,"organizador");await page.goto("/organizador/personas");
    await page.getByRole("button",{name:"Delete: Estudiante1 Prueba",exact:true}).click();
    await page.getByLabel("Mail para confirmar eliminación").fill("prueba-estudiante-1@tim.test");
    await page.getByRole("button",{name:"Eliminar cuenta y datos",exact:true}).click();
    await expect(page.getByText("Cuenta y datos eliminados. Se guardó un respaldo privado.",{exact:true})).toBeVisible();
    expect((await admin.from("entregas_equipo").select("cargado_por").eq("equipo_id",eq.id).single()).data?.cargado_por).toBeNull();
    expect((await page.request.get(`/entregas/${eq.id}`)).status()).toBe(200);
  } finally {
    if(ruta)await admin.storage.from("entregas").remove([ruta]);
    await admin.from("entregas_equipo").delete().eq("equipo_id",eq.id);
    await admin.from("respaldos_eliminacion").delete().eq("usuario_id",autor.id);
  }
});
