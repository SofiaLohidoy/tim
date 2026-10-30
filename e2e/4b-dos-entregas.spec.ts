import { test,expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { entrar,salir } from "./ayuda";
config({path:".env.local",quiet:true});
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY!,{auth:{persistSession:false}});

test("el equipo comparte empresa, documento y presentación sin reemplazar una entrega con otra",async({page})=>{
  test.setTimeout(100_000);
  const eq=(await admin.from("equipos").select("id,evento_id").eq("nombre","prueba-Equipo 1").single()).data!;
  const principal=Buffer.from("%PDF-1.4 prueba-documento-principal");
  try {
    await admin.from("equipos").update({empresa_elegida:"Programon"}).eq("id",eq.id);
    await entrar(page,"estudiante-1");await page.goto("/inicio");
    await expect(page.getByLabel("Empresa elegida",{exact:true})).toHaveValue("");
    await expect(page.getByRole("option",{name:"Programon",exact:true})).toHaveCount(0);
    await page.getByLabel("Empresa elegida",{exact:true}).selectOption("V-go");
    await page.getByRole("button",{name:"Guardar empresa",exact:true}).click();
    await expect(page.getByText("Empresa guardada para todo el equipo.",{exact:true})).toBeVisible();
    for(const [label,nombre,mime,buffer] of [
      ["Documento principal","prueba-documento.pdf","application/pdf",principal],
      ["Archivo de presentación","prueba-presentacion.pdf","application/pdf",Buffer.from("%PDF-1.4 prueba-presentacion")],
      ["Archivo de presentación","prueba-presentacion.pptx","application/vnd.openxmlformats-officedocument.presentationml.presentation",Buffer.from("PK prueba-presentacion-pptx")],
    ] as const){
      const response=page.waitForResponse(r=>r.url().endsWith("/api/entregas")&&r.request().method()==="POST");
      await page.getByLabel(label,{exact:true}).setInputFiles({name:nombre,mimeType:mime,buffer});
      expect((await response).status()).toBe(200);
      await expect(page.getByRole("link",{name:nombre,exact:true})).toBeVisible();
    }
    await page.getByLabel("Enlace de presentación (opcional)",{exact:true}).fill("https://www.canva.com/design/prueba-presentacion/view");
    await page.getByRole("button",{name:"Guardar",exact:true}).click();
    await expect(page.getByText("Guardado. Lo ve el jurado.",{exact:true})).toBeVisible();
    expect(await (await page.request.get(`/entregas/${eq.id}`)).body()).toEqual(principal);
    await page.reload();
    await expect(page.getByLabel("Empresa elegida",{exact:true})).toHaveValue("V-go");
    await expect(page.getByRole("link",{name:"prueba-documento.pdf",exact:true})).toBeVisible();
    await expect(page.getByRole("link",{name:"prueba-presentacion.pptx",exact:true})).toBeVisible();
    for(const width of [375,1280]){await page.setViewportSize({width,height:812});await page.screenshot({path:`capturas/dos-entregas-estudiante-${width}.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
    await salir(page);await entrar(page,"estudiante-3");await page.goto("/inicio");
    await expect(page.getByLabel("Empresa elegida",{exact:true})).toHaveValue("V-go");
    await expect(page.getByRole("link",{name:"prueba-documento.pdf",exact:true})).toBeVisible();
    await salir(page);await entrar(page,"organizador");await page.goto(`/organizador/entregas?evento=${eq.evento_id}`);
    await expect(page.getByText("Empresa elegida: V-go",{exact:true})).toBeVisible();
    await expect(page.getByText("prueba-presentacion.pptx",{exact:true})).toBeVisible();
    await salir(page);await entrar(page,"jurado");await page.goto(`/jurado/${eq.id}`);
    await expect(page.getByText("Empresa elegida: V-go",{exact:true})).toBeVisible();
    await expect(page.getByRole("link",{name:"Ver link de presentación de prueba-Equipo 1",exact:true})).toHaveAttribute("href","https://www.canva.com/design/prueba-presentacion/view");
    expect((await page.request.get(`/entregas/${eq.id}?tipo=presentacion`)).status()).toBe(200);
    await salir(page);await entrar(page,"estudiante-2");
    expect((await page.request.get(`/entregas/${eq.id}?tipo=presentacion`)).status()).toBe(404);
  } finally {
    for(const tabla of ["entregas_equipo","presentaciones_equipo"]){const a=await admin.from(tabla).select("archivo_path").eq("equipo_id",eq.id).maybeSingle();if(a.data)await admin.storage.from("entregas").remove([a.data.archivo_path]);await admin.from(tabla).delete().eq("equipo_id",eq.id);}
    await admin.from("equipos").update({empresa_elegida:null,entrega_url:null}).eq("id",eq.id);
  }
});
