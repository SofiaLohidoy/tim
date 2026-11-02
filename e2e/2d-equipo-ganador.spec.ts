import {expect,test} from "@playwright/test";
import {entrar,salir} from "./ayuda";

test("el reconocimiento del ganador aparece solo en las devoluciones de su equipo",async({page})=>{
  test.setTimeout(90000);
  await entrar(page,"organizador");await page.goto("/organizador/devoluciones");
  await page.getByLabel("Equipo ganador",{exact:true}).selectOption({label:"prueba-Equipo 1"});
  await page.getByRole("button",{name:"Guardar equipo ganador",exact:true}).click();
  await expect(page.getByText("Equipo ganador: prueba-Equipo 1",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:/^(Preparar devoluciones|Preparar nueva publicación|Volver a preparar)$/}).click();
  await expect(page.getByText(/devoluciones preparadas/)).toBeVisible();
  await page.getByRole("button",{name:/^(Publicar a los estudiantes|Publicar actualización)$/}).click();
  await page.getByRole("button",{name:"Sí, publicar",exact:true}).click();
  await expect(page.getByText(/Publicadas:/)).toBeVisible();
  await page.reload();await expect(page.getByText("Equipo ganador: prueba-Equipo 1",{exact:true})).toBeVisible();
  await page.getByText("Estudiante1 Prueba",{exact:true}).click();
  await expect(page.getByRole("region",{name:"Reconocimiento del evento",exact:true})).toBeVisible();
  await salir(page);await entrar(page,"estudiante-1");await page.goto("/devolucion");
  await expect(page.getByRole("region",{name:"Reconocimiento del evento",exact:true})).toBeVisible();
  await expect(page.getByText("Tu equipo fue elegido ganador de esta edición. ¡Felicitaciones por el trabajo que construyeron juntos!",{exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Lo que observaron de vos",exact:true})).toBeVisible();
  for(const width of [375,1280]){await page.setViewportSize({width,height:812});await page.screenshot({path:`capturas/equipo-ganador-${width}.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await salir(page);await entrar(page,"estudiante-2");await page.goto("/devolucion");
  await expect(page.getByRole("heading",{name:"Lo que observaron de vos",exact:true})).toBeVisible();
  await expect(page.getByRole("region",{name:"Reconocimiento del evento",exact:true})).toHaveCount(0);
});
