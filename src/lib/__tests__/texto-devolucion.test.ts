import {expect,it} from "vitest";
import {bloquesDevolucion} from "@/lib/texto-devolucion";

it("une los cortes del PDF en párrafos y separa sus títulos sin perder palabras",()=>{
  const texto="Equipo prueba | Devolución del jurado\r\nHackatón TIM\r\nGracias por participar y presentar su propuesta \r\npara el desafío.\r\nAspectos valorados\r\nSe reconoció una presentación \r\nclara y buenos entregables.\r\nPara continuar\r\nValidar las hipótesis.";
  const b=bloquesDevolucion(texto);
  expect(b.find(x=>x.texto.startsWith("Gracias"))).toEqual({tipo:"parrafo",texto:"Gracias por participar y presentar su propuesta para el desafío."});
  expect(b.find(x=>x.texto==="Aspectos valorados")?.tipo).toBe("titulo");
  expect(b.map(x=>x.texto).join(" ")).toBe(texto.replace(/\s+/g," ").trim());
});
it("respeta párrafos existentes, texto sin encabezados y HTML como texto",()=>{
  expect(bloquesDevolucion("Primer párrafo\ncon sus palabras.\n\nSegundo párrafo <script>texto</script>.")).toEqual([
    {tipo:"parrafo",texto:"Primer párrafo con sus palabras."},
    {tipo:"parrafo",texto:"Segundo párrafo <script>texto</script>."},
  ]);
});
