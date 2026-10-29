import { expect,test } from "@playwright/test";
import { entrar,salir } from "./ayuda";

test("se puede preparar y publicar otra versión sin ocultar la actual",async({page})=>{
  test.setTimeout(100_000);
  const texto="prueba-observación de la segunda publicación";
  await entrar(page,"mentor-1");
  await page.getByRole("link",{name:/Estudiante1 Prueba/}).click();
  await expect(page.getByLabel("Comentario general",{exact:false})).toBeEnabled();
  await page.getByLabel("Comentario general",{exact:false}).fill(texto);
  const anterior=page.url();
  await page.getByRole("button",{name:/^Guardar cambios y/}).click();
  await expect(page).not.toHaveURL(anterior);
  await salir(page);await entrar(page,"organizador");await page.goto("/organizador/devoluciones");
  await page.getByRole("button",{name:"Preparar nueva publicación",exact:true}).click();
  await expect(page.getByText(/devoluciones preparadas/)).toBeVisible();
  await expect(page.getByText("Nueva versión preparada. Todavía no es visible para los estudiantes.",{exact:true})).toBeVisible();
  await page.getByText("Estudiante1 Prueba",{exact:true}).click();
  await expect(page.getByText(texto,{exact:false})).toBeVisible();
  for(const width of [375,1280]){await page.setViewportSize({width,height:812});await page.screenshot({path:`capturas/republicar-pendiente-${width}.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await salir(page);await entrar(page,"estudiante-1");await page.goto("/devolucion");
  await expect(page.getByRole("heading",{name:"Lo que observaron de vos",exact:true})).toBeVisible();
  await expect(page.getByText(texto,{exact:false})).toHaveCount(0);
  await salir(page);await entrar(page,"organizador");await page.goto("/organizador/devoluciones");
  await page.getByRole("button",{name:"Publicar actualización",exact:true}).click();
  await page.getByRole("button",{name:"Sí, publicar",exact:true}).click();
  await expect(page.getByText(/Publicadas:/)).toBeVisible();
  await expect(page.getByRole("button",{name:"Preparar nueva publicación",exact:true})).toBeVisible();
  for(const width of [375,1280]){await page.setViewportSize({width,height:812});await page.screenshot({path:`capturas/republicar-publicada-${width}.png`,fullPage:true});}
  await salir(page);await entrar(page,"estudiante-1");await page.goto("/devolucion");
  await expect(page.getByText(texto,{exact:false})).toBeVisible();
});
