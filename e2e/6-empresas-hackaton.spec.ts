import { expect, test } from "@playwright/test";
import documentos from "../src/lib/hackaton/documentos.json";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { entrar, salir } from "./ayuda";
config({path:".env.local",quiet:true});
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY!,{auth:{persistSession:false}});
const sha=(data:Buffer)=>createHash("sha256").update(data).digest("hex");
test("la inscripción habilita cuatro documentos originales y BIOTEC queda próximamente",async({page})=>{
  test.setTimeout(60_000);
  await entrar(page,"estudiante-2");
  const uid=(await admin.from("perfiles").select("id").eq("email","prueba-estudiante-2@tim.test").single()).data!.id;
  const miembro=(await admin.from("miembros_equipo").select("evento_id").eq("usuario_id",uid).limit(1).single()).data!;
  await admin.from("asistencias").delete().eq("usuario_id",uid).eq("evento_id",miembro.evento_id);
  for(const ruta of ["/inicio","/hackaton/bienvenida"]){
    await page.goto(ruta);
    await expect(page.getByRole("list",{name:"Documentos de las empresas",exact:true})).toHaveCount(0);
  }
  for(const ruta of ["/hackaton/empresas/v-go/documento","/hackaton/empresas/kankay/documento","/hackaton/empresas/fardo/documento","/hackaton/empresas/lisa/documento","/hackaton/guia/documento"]){
    expect((await page.request.get(ruta)).status()).toBe(403);
  }
  await expect(page.getByRole("link",{name:"Descargar guía (PDF)",exact:true})).toHaveAttribute("href","/documentos/bienvenida-hackathon-tim.pdf");
  await page.goto("/inicio");
  const orden=await page.getByRole("main").locator("h2, a[href='/hackaton/bienvenida']").allTextContents();
  expect(orden[0]).toContain("prueba-");
  expect(orden[1]).toContain("Tu guía de la hackatón");
  await expect(page.getByText("El desafío",{exact:true})).toHaveCount(0);
  await expect(page.getByText("Tu devolución",{exact:true})).toHaveCount(0);
  await page.getByPlaceholder("ABC123",{exact:true}).fill("QRTEST");
  await page.getByRole("button",{name:"Marcar",exact:true}).click();
  await expect(page.getByText(/Estuviste ahí\.|Listo, quedó marcada tu asistencia\./).first()).toBeVisible();
  for(const ruta of ["/hackaton/bienvenida","/inicio"]){
    await page.goto(ruta);
    const lista=page.getByRole("list",{name:"Documentos de las empresas",exact:true});
    await expect(lista.getByRole("listitem")).toHaveCount(5);
    for(const nombre of ["Kankay","V-go","Fardo","Lisa","BIOTEC"])await expect(lista.getByRole("heading",{name:nombre,exact:true})).toBeVisible();
    await expect(lista.getByText("Documento próximamente",{exact:true})).toHaveCount(1);
    await expect(lista.getByRole("link")).toHaveCount(4);
    for(const img of await lista.locator("img").all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);}
  }
  for(const empresa of ["v-go","kankay","fardo","lisa"] as const){
    const pdf=await page.request.get(`/hackaton/empresas/${empresa}/documento`);
    expect(pdf.status()).toBe(200);expect(pdf.headers()["content-type"]).toBe("application/pdf");
    expect(sha(await pdf.body())).toBe(documentos[empresa].sha256);
  }
  expect((await page.request.get("/hackaton/empresas/biotec/documento")).status()).toBe(404);
  expect((await page.request.get("/hackaton/guia/documento")).status()).toBe(200);
  await salir(page);
  for(const empresa of ["v-go","kankay","fardo","lisa"]){const sinSesion=await page.request.get(`/hackaton/empresas/${empresa}/documento`,{maxRedirects:0});expect(sinSesion.status()).toBe(307);}
});
