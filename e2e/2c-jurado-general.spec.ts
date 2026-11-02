import { expect,test } from "@playwright/test";
import { entrar,salir } from "./ayuda";

test("el texto colectivo se revisa y publica por equipo, sin reemplazar al mentor",async({page})=>{
  test.setTimeout(120000);
  const textos=["prueba-Devolución colectiva del primer equipo.\n\nAspectos valorados\n"+"Fortalezas y próximos pasos con evidencia. ".repeat(20),"prueba-Devolución colectiva exclusiva del segundo equipo.\n\nRevisar la propuesta y sus fundamentos."];
  await entrar(page,"organizador");await page.goto("/organizador/devoluciones");
  for(const [i,texto] of textos.entries()){
    const d=page.locator("details").filter({has:page.getByLabel(`Texto para prueba-Equipo ${i+1}`,{exact:true})});
    await d.locator("summary").click();
    await d.getByLabel("Cargar texto (.txt)",{exact:true}).setInputFiles({name:"prueba-jurado.txt",mimeType:"text/plain",buffer:Buffer.from(texto)});
    await expect(d.getByLabel(`Texto para prueba-Equipo ${i+1}`,{exact:true})).toHaveValue(texto);
    await d.getByRole("button",{name:"Guardar devolución del jurado",exact:true}).click();
    await expect(d.getByRole("status")).toContainText("todavía no se publicó");
  }
  await page.getByRole("button",{name:"Preparar nueva publicación",exact:true}).click();
  await expect(page.getByText(/devoluciones preparadas/)).toBeVisible();
  for(const width of [375,1280]){await page.setViewportSize({width,height:812});await page.screenshot({path:`capturas/jurado-general-org-${width}.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await salir(page);await entrar(page,"estudiante-1");await page.goto("/devolucion");
  await expect(page.getByRole("heading",{name:"Devolución general del jurado",exact:true})).toHaveCount(0);
  await salir(page);await entrar(page,"organizador");await page.goto("/organizador/devoluciones");
  await page.getByRole("button",{name:"Publicar actualización",exact:true}).click();await page.getByRole("button",{name:"Sí, publicar",exact:true}).click();
  await expect(page.getByText(/Publicadas:/)).toBeVisible();
  for(const [i,texto] of textos.entries()){
    await salir(page);await entrar(page,`estudiante-${i+1}`);await page.goto("/devolucion");
    await expect(page.getByRole("heading",{name:"Devolución general del jurado",exact:true})).toBeVisible();
    const seccion=page.locator("section").filter({has:page.getByRole("heading",{name:"Devolución general del jurado",exact:true})});
    expect((await seccion.locator("h3,p").allTextContents()).join(" ")).toBe(texto.replace(/\s+/g," ").trim());
    await expect(page.getByText(textos[1-i].split("\n\n")[0],{exact:true})).toHaveCount(0);
    if(i===0)await expect(seccion.getByRole("heading",{name:"Aspectos valorados",exact:true})).toBeVisible();
    if(i===0){await expect(page.getByText("prueba-observación de la segunda publicación",{exact:false})).toBeVisible();
      for(const width of [375,1280]){await page.setViewportSize({width,height:812});await page.screenshot({path:`capturas/jurado-general-estudiante-${width}.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}}
  }
});
