import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { entrar, salir } from "./ayuda";
config({path:".env.local",quiet:true});
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY!,{auth:{persistSession:false}});
const sha=(data:Buffer)=>createHash("sha256").update(data).digest("hex");
test("la bienvenida y el regreso por código muestran cinco empresas y el PDF original de V-go",async({page})=>{
  test.setTimeout(60_000);
  await entrar(page,"estudiante-2");
  for(const ruta of ["/hackaton/bienvenida","/inicio"]){
    await page.goto(ruta);
    const lista=page.getByRole("list",{name:"Documentos de las empresas",exact:true});
    await expect(lista.getByRole("listitem")).toHaveCount(5);
    for(const nombre of ["Kankay","V-go","Programon","Fardo","Lisa"])await expect(lista.getByRole("heading",{name:nombre,exact:true})).toBeVisible();
    await expect(lista.getByText("Documento próximamente",{exact:true})).toHaveCount(4);
    await expect(lista.getByRole("link")).toHaveCount(1);
    for(const img of await lista.locator("img").all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);}
  }
  const ruta="/hackaton/empresas/v-go/documento";
  const pdf=await page.request.get(ruta);
  expect(pdf.status()).toBe(200);expect(pdf.headers()["content-type"]).toBe("application/pdf");
  expect(sha(await pdf.body())).toBe(sha(await readFile("src/contenidos/hackaton/v-go.pdf")));
  expect((await page.request.get("/hackaton/empresas/kankay/documento")).status()).toBe(404);
  const uid=(await admin.from("perfiles").select("id").eq("email","prueba-estudiante-2@tim.test").single()).data!.id;
  const miembro=(await admin.from("miembros_equipo").select("evento_id").eq("usuario_id",uid).limit(1).single()).data!;
  await admin.from("asistencias").delete().eq("usuario_id",uid).eq("evento_id",miembro.evento_id);
  await page.goto("/inicio");await page.getByPlaceholder("ABC123",{exact:true}).fill("QRTEST");
  await page.getByRole("button",{name:"Marcar",exact:true}).click();
  await expect(page.getByText(/Estuviste ahí\.|Listo, quedó marcada tu asistencia\./).first()).toBeVisible();
  await expect(page.getByRole("list",{name:"Documentos de las empresas",exact:true})).toBeVisible();
  await salir(page);
  const sinSesion=await page.request.get(ruta,{maxRedirects:0});expect(sinSesion.status()).toBe(307);
});
